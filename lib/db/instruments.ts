import 'server-only'

import {getCatalogueDirectory, getCatalogWorksSafe, type ComposerAliases} from '@/lib/db/composers'
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
}

export type InstrumentWork = {
    catalogueCode: string
    catalogueName: string | null
    composerName: string
    composerAliases: ComposerAliases
    sort: string
    catalogueNumber: string
    title: string
}

type InstrumentIndex = Map<string, InstrumentWork[]>

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
        for (const work of works) {
            for (const abbrev of findInstrumentAbbrevs(work.instrumentation)) {
                const list = index.get(abbrev) ?? []
                list.push({
                    catalogueCode: entry.catalogue,
                    catalogueName: entry.catalogueName ?? null,
                    composerName: entry.composerName,
                    composerAliases: entry.composerAliases,
                    sort: work.sort,
                    catalogueNumber: work.catalogue,
                    title: work.title,
                })
                index.set(abbrev, list)
            }
        }
    }

    for (const list of index.values()) {
        list.sort((left, right) =>
            left.composerName.localeCompare(right.composerName, 'en', {sensitivity: 'base'})
            || left.sort.localeCompare(right.sort, undefined, {numeric: true, sensitivity: 'base'}))
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

export function getInstrumentRef(abbrev: string): InstrumentRef | undefined {
    return instrumentByAbbrev.get(abbrev)
}

export async function getInstrumentFamilies(locale: Locale) {
    const index = await getInstrumentIndex()
    return INSTRUMENTATION_ABBREVIATIONS.flatMap(group => {
        const items = group.items.flatMap(item => {
            const count = index.get(item.abbrev)?.length ?? 0
            return count > 0 ? [{abbrev: item.abbrev, label: item[locale], count}] : []
        })
        return items.length > 0 ? [{key: group.key, label: group[locale], items}] : []
    })
}

export async function getInstrumentWorks(abbrev: string): Promise<InstrumentWork[]> {
    const index = await getInstrumentIndex()
    return index.get(abbrev) ?? []
}
