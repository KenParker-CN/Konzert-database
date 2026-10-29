import 'server-only'

import {getCatalogueDirectory, getCatalogWorksSafe, type ComposerWork} from '@/lib/db/composers'

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

type IndexedCatalogue = {
    result: CatalogueSearchResult
    text: string
}

type IndexedWork = {
    result: WorkSearchResult
    text: string
}

type SearchIndex = {
    catalogues: IndexedCatalogue[]
    works: IndexedWork[]
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

    return {catalogues: indexedCatalogues, works: indexedWorks.flat()}
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

export async function searchArchive(query: string, options?: {
    catalogueOffset?: number
    catalogueLimit?: number
    workOffset?: number
    workLimit?: number
}) {
    const normalizedQuery = normalizeText(query)
    if (!normalizedQuery) {
        return {
            catalogues: {total: 0, results: [] as CatalogueSearchResult[]},
            works: {total: 0, results: [] as WorkSearchResult[]},
        }
    }

    const index = await getSearchIndex()
    const catalogueMatches = index.catalogues
        .map(entry => ({...entry, score: scoreMatch(entry.text, normalizedQuery)}))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.result.composerName.localeCompare(b.result.composerName))
    const workMatches = index.works
        .map(entry => ({...entry, score: scoreMatch(entry.text, normalizedQuery)}))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score
            || a.result.composerName.localeCompare(b.result.composerName)
            || a.result.sort.localeCompare(b.result.sort, undefined, {numeric: true, sensitivity: 'base'}))

    const catalogueOffset = Math.max(0, options?.catalogueOffset ?? 0)
    const catalogueLimit = Math.max(0, options?.catalogueLimit ?? 3)
    const workOffset = Math.max(0, options?.workOffset ?? 0)
    const workLimit = Math.max(0, options?.workLimit ?? 5)

    return {
        catalogues: {
            total: catalogueMatches.length,
            results: catalogueMatches.slice(catalogueOffset, catalogueOffset + catalogueLimit).map(entry => entry.result),
        },
        works: {
            total: workMatches.length,
            results: workMatches.slice(workOffset, workOffset + workLimit).map(entry => entry.result),
        },
    }
}
