import 'server-only'

import {getCatalogueDirectory, getCatalogWorksSafe, type ComposerAliases, type GenreRelatedWorkGroup} from '@/lib/db/composers'
import {getInstrumentRows} from '@/lib/data/csv-loader'
import type {Locale} from '@/lib/i18n/config'

const INSTRUMENT_INDEX_CACHE_TTL_MS = 5 * 60 * 1000

type Names = Record<Locale, string>

export type InstrumentRef = {
    abbrev: string
    name: Names
    familyKey: string
    familyName: Names
    wikiID?: string
    relatedAbbrev?: string
}

type InstrumentFamily = {
    key: string
    name: Names
    wikiID?: string
    refs: InstrumentRef[]
}

type InstrumentCatalog = {
    refs: Map<string, InstrumentRef>
    families: InstrumentFamily[]
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

type Matcher = {
    abbrevs: Set<string>
    byName: Map<string, string>
}

let instrumentIndexCache: {
    expiresAt: number
    request: Promise<InstrumentIndex>
} | undefined

let instrumentCatalogCache: {
    expiresAt: number
    request: Promise<InstrumentCatalog>
} | undefined

function normalizeName(value: string) {
    const base = value.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLocaleLowerCase('en')
    return base.length > 4 && base.endsWith('s') && !base.endsWith('ss') ? base.slice(0, -1) : base
}

function resolveAbbrev(matcher: Matcher, text: string): string | undefined {
    if (matcher.abbrevs.has(text)) return text
    const name = normalizeName(text)
    return matcher.byName.get(name) ?? NAME_ALIASES[name]
}

function findInstrumentAbbrevs(matcher: Matcher, instrumentation: string): Set<string> {
    const found = new Set<string>()
    for (const segment of instrumentation.split(SEGMENT_SEPARATOR)) {
        const cleaned = segment
            .replace(/\([^)]*\)/g, ' ')
            .replace(/[$§]/g, ' ')
            .replace(/^[\s\d.-]+/, '')
            .trim()
        if (!cleaned) continue

        const whole = resolveAbbrev(matcher, cleaned)
        if (whole) {
            found.add(whole)
            continue
        }

        for (const part of cleaned.split(/[\s.-]+/)) {
            if (part.length < 2) continue
            const abbrev = resolveAbbrev(matcher, part)
            if (abbrev) found.add(abbrev)
        }
    }
    return found
}

function buildMatcher(rows: Array<{name: string; abbr: string}>): Matcher {
    const matcher: Matcher = {abbrevs: new Set(), byName: new Map()}
    for (const row of rows) {
        if (!row.abbr) continue
        matcher.abbrevs.add(row.abbr)
        matcher.byName.set(normalizeName(row.name), row.abbr)
    }
    return matcher
}

async function buildInstrumentIndex(): Promise<InstrumentIndex> {
    const [directory, rows] = await Promise.all([getCatalogueDirectory(), getInstrumentRows()])
    const matcher = buildMatcher(rows)
    const loaded = await Promise.all(directory.map(async entry => ({
        entry,
        works: (await getCatalogWorksSafe(entry.catalogue)).works,
    })))

    const index: InstrumentIndex = new Map()
    for (const {entry, works} of loaded) {
        const worksByAbbrev = new Map<string, typeof works>()
        for (const work of works) {
            for (const abbrev of findInstrumentAbbrevs(matcher, work.instrumentation)) {
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

function uniformNames(text: string): Names {
    return {en: text, zh: text, fr: text, de: text}
}

async function buildInstrumentCatalog(): Promise<InstrumentCatalog> {
    const rows = await getInstrumentRows()
    const rowByName = new Map(rows.map(row => [row.name.toLocaleLowerCase('en'), row]))
    const refs = new Map<string, InstrumentRef>()
    const families = new Map<string, InstrumentFamily>()

    for (const row of rows) {
        if (!row.abbr || !row.typeOf || refs.has(row.abbr)) continue

        const familyKey = row.typeOf.toLocaleLowerCase('en').replace(/\s+/g, '-')
        let family = families.get(familyKey)
        if (!family) {
            const familyRow = rowByName.get(row.typeOf.toLocaleLowerCase('en'))
            family = {
                key: familyKey,
                name: familyRow ? localizedNames(familyRow) : uniformNames(row.typeOf),
                wikiID: familyRow?.wikiQID || undefined,
                refs: [],
            }
            families.set(familyKey, family)
        }

        const ref: InstrumentRef = {
            abbrev: row.abbr,
            name: localizedNames(row),
            familyKey,
            familyName: family.name,
            wikiID: row.wikiQID || undefined,
            relatedAbbrev: rowByName.get(row.relatedTo.toLocaleLowerCase('en'))?.abbr || undefined,
        }
        refs.set(row.abbr, ref)
        family.refs.push(ref)
    }

    return {refs, families: [...families.values()]}
}

function localizedNames(row: {name: string; aliasZh: string; aliasFr: string; aliasDe: string}): Names {
    return {en: row.name, zh: row.aliasZh || row.name, fr: row.aliasFr || row.name, de: row.aliasDe || row.name}
}

function getInstrumentCatalog(): Promise<InstrumentCatalog> {
    if (!instrumentCatalogCache || instrumentCatalogCache.expiresAt <= Date.now()) {
        instrumentCatalogCache = {
            expiresAt: Date.now() + INSTRUMENT_INDEX_CACHE_TTL_MS,
            request: buildInstrumentCatalog(),
        }
    }
    return instrumentCatalogCache.request
}

export async function getInstrumentRef(abbrev: string): Promise<InstrumentRef | undefined> {
    return (await getInstrumentCatalog()).refs.get(abbrev)
}

export async function getInstrumentFamilies(locale: Locale) {
    const [index, catalog] = await Promise.all([getInstrumentIndex(), getInstrumentCatalog()])
    return catalog.families.flatMap(family => {
        const items = family.refs.flatMap(ref => {
            const count = (index.get(ref.abbrev) ?? []).reduce((sum, work) => sum + work.works.length, 0)
            return count > 0 ? [{abbrev: ref.abbrev, label: ref.name[locale], count}] : []
        })
        return items.length > 0 ? [{key: family.key, label: family.name[locale], wikiID: family.wikiID, items}] : []
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
