import 'server-only'

import {getCatalogueDirectory, getCatalogWorksSafe, type ComposerAliases, type GenreRelatedWorkGroup} from '@/lib/db/composers'
import {getInstrumentRows} from '@/lib/data/csv-loader'
import type {Locale} from '@/lib/i18n/config'
import {
    INSTRUMENTATION_ABBREVIATIONS,
    type InstrumentationAbbrev,
    type InstrumentationAbbrevGroup,
} from '@/lib/i18n/instrumentation-abbreviations'

const INSTRUMENT_INDEX_CACHE_TTL_MS = 5 * 60 * 1000

export type InstrumentRef = {
    group: InstrumentationAbbrevGroup
    item: InstrumentationAbbrev
    wikiID?: string
    relatedAbbrev?: string
}

type InstrumentLink = {
    wikiID?: string
    relatedAbbrev?: string
}

type IndexedWorkGroup = Omit<GenreRelatedWorkGroup, 'composerName'> & {
    composerName: string
    composerAliases: ComposerAliases
}

type InstrumentIndex = Map<string, IndexedWorkGroup[]>

const NAME_ALIASES: Record<string, string> = {
    cello: 'vlc',
    violoncello: 'vlc',
    contrabass: 'db',
    cor: 'hn',
}

const SEGMENT_SEPARATOR = /[,;\n/+]|\s+and\s+/i

const instrumentByAbbrev = new Map<string, InstrumentRef>()
const instrumentByName = new Map<string, InstrumentRef>()

for (const group of INSTRUMENTATION_ABBREVIATIONS) {
    for (const item of group.items) {
        const ref = {group, item}
        instrumentByAbbrev.set(item.abbrev, ref)
        for (const name of item.en.split('/')) {
            instrumentByName.set(normalizeName(name), ref)
        }
    }
}

let instrumentIndexCache: {
    expiresAt: number
    request: Promise<InstrumentIndex>
} | undefined

function normalizeName(value: string) {
    const base = value.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLocaleLowerCase('en')
    return base.length > 4 && base.endsWith('s') && !base.endsWith('ss') ? base.slice(0, -1) : base
}

function resolveAbbrev(text: string): string | undefined {
    if (instrumentByAbbrev.has(text)) return text
    const name = normalizeName(text)
    return instrumentByName.get(name)?.item.abbrev ?? NAME_ALIASES[name]
}

function findInstrumentAbbrevs(instrumentation: string): Set<string> {
    const found = new Set<string>()
    for (const segment of instrumentation.split(SEGMENT_SEPARATOR)) {
        const cleaned = segment
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[$§]/g, ' ')
            .replace(/^[\s\d.-]+/, '')
            .trim()
        if (!cleaned) continue

        const whole = resolveAbbrev(cleaned)
        if (whole) {
            found.add(whole)
            continue
        }

        for (const part of cleaned.split(/[\s.-]+/)) {
            if (part.length < 2) continue
            const abbrev = resolveAbbrev(part)
            if (abbrev) found.add(abbrev)
        }
    }
    return found
}

async function buildInstrumentIndex(): Promise<InstrumentIndex> {
    const directory = await getCatalogueDirectory()
    const loaded = await Promise.all(directory.map(async entry => ({
        entry,
        works: (await getCatalogWorksSafe(entry.catalogue)).works,
    })))

    const index: InstrumentIndex = new Map()
    for (const {entry, works} of loaded) {
        const worksByAbbrev = new Map<string, typeof works>()
        for (const work of works) {
            for (const abbrev of findInstrumentAbbrevs(work.instrumentation)) {
                worksByAbbrev.set(abbrev, [...(worksByAbbrev.get(abbrev) ?? []), work])
            }
        }

        for (const [abbrev, matched] of worksByAbbrev) {
            const groups = index.get(abbrev) ?? []
            groups.push({
                catalogue: entry.catalogue,
                catalogueName: entry.catalogueName || entry.catalogue,
                composerName: entry.composerName,
                composerAliases: entry.composerAliases,
                composerSlug: entry.composerSlug,
                works: matched.sort((left, right) => left.sort.localeCompare(right.sort, undefined, {numeric: true, sensitivity: 'base'})),
            })
            index.set(abbrev, groups)
        }
    }
    return index
}

function getInstrumentIndex(): Promise<InstrumentIndex> {
    if (!instrumentIndexCache || instrumentIndexCache.expiresAt <= Date.now()) {
        instrumentIndexCache = {
            expiresAt: Date.now() + INSTRUMENT_INDEX_CACHE_TTL_MS,
            request: buildInstrumentIndex(),
        }
    }
    return instrumentIndexCache.request
}

let instrumentLinkCache: {
    expiresAt: number
    request: Promise<Map<string, InstrumentLink>>
} | undefined

async function buildInstrumentLinks(): Promise<Map<string, InstrumentLink>> {
    const rows = await getInstrumentRows()
    const abbrByName = new Map<string, string>()
    for (const row of rows) {
        if (row.abbr) abbrByName.set(row.name.toLocaleLowerCase('en'), row.abbr)
    }

    const links = new Map<string, InstrumentLink>()
    for (const row of rows) {
        if (!row.abbr) continue
        links.set(row.abbr, {
            wikiID: row.wikiQID || undefined,
            relatedAbbrev: abbrByName.get(row.relatedTo.toLocaleLowerCase('en')),
        })
    }
    return links
}

function getInstrumentLinks(): Promise<Map<string, InstrumentLink>> {
    if (!instrumentLinkCache || instrumentLinkCache.expiresAt <= Date.now()) {
        instrumentLinkCache = {
            expiresAt: Date.now() + INSTRUMENT_INDEX_CACHE_TTL_MS,
            request: buildInstrumentLinks(),
        }
    }
    return instrumentLinkCache.request
}

export async function getInstrumentRef(abbrev: string): Promise<InstrumentRef | undefined> {
    const ref = instrumentByAbbrev.get(abbrev)
    if (!ref) return undefined
    const link = (await getInstrumentLinks()).get(abbrev)
    return {...ref, wikiID: link?.wikiID, relatedAbbrev: link?.relatedAbbrev}
}

export async function getInstrumentFamilies(locale: Locale) {
    const index = await getInstrumentIndex()
    return INSTRUMENTATION_ABBREVIATIONS.flatMap(group => {
        const items = group.items.flatMap(item => {
            const count = (index.get(item.abbrev) ?? []).reduce((sum, work) => sum + work.works.length, 0)
            return count > 0 ? [{abbrev: item.abbrev, label: item[locale], count}] : []
        })
        return items.length > 0 ? [{key: group.key, label: group[locale], items}] : []
    })
}

export async function getInstrumentRelatedWorkGroups(abbrev: string, locale: Locale): Promise<GenreRelatedWorkGroup[]> {
    const index = await getInstrumentIndex()
    return (index.get(abbrev) ?? [])
        .map(({composerAliases, ...group}) => ({
            ...group,
            composerName: composerAliases[locale] || group.composerName,
        }))
        .sort((left, right) => left.composerName.localeCompare(right.composerName, undefined, {sensitivity: 'base'}))
}
