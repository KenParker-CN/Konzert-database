import 'server-only'

import {getGenreCsvEntries, type GenreCsvEntry} from '@/lib/data/csv-loader'
import {getGenrePath} from '@/lib/data/genre-v2'
import {getCatalogueDirectory, getCatalogWorksSafe, type ComposerWork} from '@/lib/db/composers'
import {getInstrumentPath, getInstrumentRefsWithWorks, type InstrumentRef} from '@/lib/db/instruments'
import {localePath, type Locale} from '@/lib/i18n/config'
import {localizeGenreTerm} from '@/lib/i18n/genre-term'

const SEARCH_INDEX_TTL_MS = 5 * 60 * 1000

export type CatalogueSearchResult = {
    catalogue: string
    catalogueName: string | null
    composerName: string
    workCount: number
}

export type WorkSearchResult = {
    workId: number
    catalogue: string
    catalogueCode: string
    catalogueName: string | null
    composerName: string
    sort: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    genre: string
    key: string
    instrumentation: string
    details: Record<string, string>
}

export type LinkSearchResult = {
    href: string
    label: string
    subtitle: string | null
}

export type SearchKind = 'catalogues' | 'works' | 'instruments' | 'genres'

export type SearchWindow = {offset?: number; limit?: number}

export type SearchWindows = Partial<Record<SearchKind, SearchWindow>>

const DEFAULT_LIMITS: Record<SearchKind, number> = {catalogues: 3, works: 5, instruments: 3, genres: 3}

type IndexedCatalogue = {
    result: CatalogueSearchResult
    text: string
}

type IndexedWork = {
    result: WorkSearchResult
    text: string
}

type IndexedInstrument = {
    ref: InstrumentRef
    text: string
}

type IndexedGenre = {
    entry: GenreCsvEntry
    text: string
}

type SearchIndex = {
    catalogues: IndexedCatalogue[]
    works: IndexedWork[]
    instruments: IndexedInstrument[]
    genres: IndexedGenre[]
}

let searchIndexCache: {
    expiresAt: number
    request: Promise<SearchIndex>
} | undefined

function normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().trim()
}

function getWorkText(work: ComposerWork, composerName: string): string {
    return normalizeText([
        composerName,
        work.sort,
        work.catalogue,
        work.opus,
        work.secondaryCatalogue,
        work.title,
        work.genre,
        work.key,
        work.instrumentation,
        ...Object.values(work.details),
    ].join(' '))
}

function getInstrumentText(ref: InstrumentRef): string {
    return normalizeText([
        ref.abbrev,
        ...Object.values(ref.name),
        ...(ref.familyName ? Object.values(ref.familyName) : []),
    ].join(' '))
}

async function buildSearchIndex(): Promise<SearchIndex> {
    const directory = await getCatalogueDirectory()
    const indexedCatalogues: IndexedCatalogue[] = []
    const indexedWorks = await Promise.all(directory.map(async entry => {
        const catalogueResult: CatalogueSearchResult = {
            catalogue: entry.catalogue,
            catalogueName: entry.catalogueName || null,
            composerName: entry.composerName,
            workCount: entry.workCount,
        }
        indexedCatalogues.push({
            result: catalogueResult,
            text: normalizeText([
                entry.catalogue,
                entry.catalogueName,
                entry.cataloguerName,
                entry.composerName,
            ].filter(Boolean).join(' ')),
        })

        const {works} = await getCatalogWorksSafe(entry.catalogue)
        return works.map(work => ({
            result: {
                ...work,
                catalogueCode: entry.catalogue,
                catalogueName: entry.catalogueName || null,
                composerName: entry.composerName,
            },
            text: getWorkText(work, entry.composerName),
        }))
    }))

    const [instrumentRefs, genreEntries] = await Promise.all([getInstrumentRefsWithWorks(), getGenreCsvEntries()])

    return {
        catalogues: indexedCatalogues,
        works: indexedWorks.flat(),
        instruments: instrumentRefs.map(ref => ({ref, text: getInstrumentText(ref)})),
        genres: genreEntries.map(entry => ({
            entry,
            text: normalizeText([entry.name, entry.nameZh, entry.medium].join(' ')),
        })),
    }
}

async function getSearchIndex(): Promise<SearchIndex> {
    if (!searchIndexCache || searchIndexCache.expiresAt <= Date.now()) {
        searchIndexCache = {
            expiresAt: Date.now() + SEARCH_INDEX_TTL_MS,
            request: buildSearchIndex(),
        }
    }
    return searchIndexCache.request
}

function scoreMatch(text: string, query: string): number {
    if (!text.includes(query)) return 0
    return text.startsWith(query) ? 2 : 1
}

function matchEntries<T extends {text: string}>(items: T[], query: string, compare: (a: T, b: T) => number): T[] {
    return items
        .map(entry => ({entry, score: scoreMatch(entry.text, query)}))
        .filter(match => match.score > 0)
        .sort((a, b) => b.score - a.score || compare(a.entry, b.entry))
        .map(match => match.entry)
}

function sliceWindow<T>(items: T[], kind: SearchKind, windows: SearchWindows): T[] {
    const {offset = 0, limit = DEFAULT_LIMITS[kind]} = windows[kind] ?? {}
    const start = Math.max(0, offset)
    return items.slice(start, start + Math.max(0, limit))
}

function toInstrumentResult(ref: InstrumentRef, locale: Locale): LinkSearchResult {
    return {
        href: localePath(locale, getInstrumentPath(ref)),
        label: ref.name[locale],
        subtitle: ref.familyName?.[locale] ?? null,
    }
}

function toGenreResult(entry: GenreCsvEntry, locale: Locale): LinkSearchResult {
    return {
        href: localePath(locale, getGenrePath(entry)),
        label: localizeGenreTerm(entry.name, locale, entry.nameZh),
        subtitle: null,
    }
}

type SearchResultGroup<T> = {total: number; results: T[]}

export type SearchResults = {
    catalogues: SearchResultGroup<CatalogueSearchResult>
    works: SearchResultGroup<WorkSearchResult>
    instruments: SearchResultGroup<LinkSearchResult>
    genres: SearchResultGroup<LinkSearchResult>
}

export async function searchArchive(query: string, locale: Locale, windows: SearchWindows = {}): Promise<SearchResults> {
    const normalizedQuery = normalizeText(query)
    if (!normalizedQuery) {
        const empty = {total: 0, results: []}
        return {catalogues: empty, works: empty, instruments: empty, genres: empty}
    }

    const index = await getSearchIndex()
    const catalogueMatches = matchEntries(index.catalogues, normalizedQuery,
        (a, b) => a.result.composerName.localeCompare(b.result.composerName))
    const workMatches = matchEntries(index.works, normalizedQuery,
        (a, b) => a.result.composerName.localeCompare(b.result.composerName)
            || a.result.sort.localeCompare(b.result.sort, undefined, {numeric: true, sensitivity: 'base'}))
    const instrumentMatches = matchEntries(index.instruments, normalizedQuery,
        (a, b) => a.ref.name.en.localeCompare(b.ref.name.en))
    const genreMatches = matchEntries(index.genres, normalizedQuery,
        (a, b) => a.entry.name.localeCompare(b.entry.name))

    return {
        catalogues: {
            total: catalogueMatches.length,
            results: sliceWindow(catalogueMatches, 'catalogues', windows).map(entry => entry.result),
        },
        works: {
            total: workMatches.length,
            results: sliceWindow(workMatches, 'works', windows).map(entry => entry.result),
        },
        instruments: {
            total: instrumentMatches.length,
            results: sliceWindow(instrumentMatches, 'instruments', windows).map(entry => toInstrumentResult(entry.ref, locale)),
        },
        genres: {
            total: genreMatches.length,
            results: sliceWindow(genreMatches, 'genres', windows).map(entry => toGenreResult(entry.entry, locale)),
        },
    }
}
