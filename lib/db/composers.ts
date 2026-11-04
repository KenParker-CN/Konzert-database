import 'server-only'

import { getComposers as loadComposers, getComposerWorks as loadComposerWorks } from '@/lib/data/csv-loader'
import catalogueUpdatesJson from '@/data/catalogue-updates.json'
import { getCatalogForComposer } from '@/lib/data/composer-catalog-map'
import {getGenreLinks} from '@/lib/data/genre-links'
import {localePath, type Locale} from '@/lib/i18n/config'
import {getLocalizedWorkTerm} from '@/lib/i18n/work-terms'

const CATALOGUE_DIRECTORY_CACHE_TTL_MS = 5 * 60 * 1000
const catalogueUpdates: Record<string, string> = catalogueUpdatesJson
let catalogueDirectoryCache: {
    expiresAt: number
    request: ReturnType<typeof getCatalogueDirectoryImpl>
} | undefined

export type ComposerAliases = {
    org: string
    en: string
    de: string
    fr: string
    zh: string
}
export type ComposerWork = {
    workId: number
    sort: string
    catalogue: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    genre: string
    key: string
    instrumentation: string
    details: Record<string, string>
}

export async function getComposer(wikiQID: string) {
    const composers = await loadComposers()
    return composers.find(composer => composer.wikiQID === wikiQID) ?? null
}

export async function getComposerIndex() {
    const composers = await loadComposers()
    return composers.map(composer => ({wikiQID: composer.wikiQID, name: composer.name, nameSort: composer.nameSort}))
}

async function getCatalogueDirectoryImpl() {
    const composers = await loadComposers()
    const catalogueEntries = composers.flatMap(composer => {
        const catalogue = getCatalogForComposer(composer.wikiQID)
        return catalogue ? [{composer, catalogue}] : []
    })

    return Promise.all(catalogueEntries.map(async ({composer, catalogue}) => {
        let workCount = 0
        try {
            workCount = (await loadComposerWorks(catalogue)).length
        } catch {
            workCount = 0
        }

        return {
            catalogue,
            catalogueName: composer.catalogueName,
            cataloguerName: composer.cataloguerName,
            composerName: composer.name,
            composerNameSort:composer.nameSort,
            composerAliases: composer.aliases,
            composerQid: composer.wikiQID,
            workCount,
            updatedAt: catalogueUpdates[catalogue] ?? null,
            era: composer.era,
            // `null`/empty means the composer has no named catalogue in the CSV, so the
            // archive presents their works as a plain composition list instead of a
            // catalogue volume.
            hasCatalogueName: Boolean(composer.catalogueName?.trim()),
        }
    }))
}

export async function getCatalogueDirectory() {
    if (!catalogueDirectoryCache || catalogueDirectoryCache.expiresAt <= Date.now()) {
        catalogueDirectoryCache = {
            expiresAt: Date.now() + CATALOGUE_DIRECTORY_CACHE_TTL_MS,
            request: getCatalogueDirectoryImpl(),
        }
    }
    return catalogueDirectoryCache.request
}

export async function getComposerDirectory() {
    const [composers, directory] = await Promise.all([loadComposers(), getCatalogueDirectory()])
    const workCounts = new Map(directory.map(entry => [entry.composerQid, entry.workCount]))
    return composers.map(composer => ({
        composerName: composer.name,
        composerNameSort: composer.nameSort,
        composerAliases: composer.aliases,
        composerQid: composer.wikiQID,
        era: composer.era,
        hasCatalogue: Boolean(getCatalogForComposer(composer.wikiQID)),
        workCount: workCounts.get(composer.wikiQID) ?? 0,
    }))
}

export function clearCatalogueDirectoryCache() {
    catalogueDirectoryCache = undefined
}

export async function getCatalogWorksSafe(catalogCode: string): Promise<{
    works: ComposerWork[]
    error: boolean
}> {
    try {
        const works = await loadComposerWorks(catalogCode)
        return {
            works: works.map(w => ({
                workId: w.workId,
                sort: w.sort,
                catalogue: w.catalogue,
                opus: w.opus,
                secondaryCatalogue: w.secondaryCatalogue,
                date: w.date,
                title: w.title,
                genre: w.genre,
                key: w.key,
                instrumentation: w.instrumentation,
                details: w.details,
            })),
            error: false,
        }
    } catch (error) {
        console.error(`[getCatalogWorksSafe] Failed to load ${catalogCode}:`, error)
        return {works: [], error: true}
    }
}

export type GenreRelatedWorkGroup = {
    catalogue: string
    catalogueName: string
    composerName: string
    composerNameSort: string
    composerQid: string
    works: ComposerWork[]
}

function normalizeGenreValue(value: string): string {
    return value.normalize('NFKC').trim().toLocaleLowerCase()
}

export async function getGenreWorksSafe(genreTerms: string[], locale: Locale): Promise<{
    groups: GenreRelatedWorkGroup[]
    error: boolean
}> {
    const terms = new Set(genreTerms.map(normalizeGenreValue).filter(Boolean))
    if (terms.size === 0) return {groups: [], error: false}

    try {
        const directory = await getCatalogueDirectory()
        const loadedGroups = await Promise.all(directory.map(async entry => {
            const result = await getCatalogWorksSafe(entry.catalogue)
            const works = result.works
                .filter(work => work.genre.split(/[;,]/).some(value => terms.has(normalizeGenreValue(value))))
                .sort((left, right) => left.sort.localeCompare(right.sort, undefined, {numeric: true, sensitivity: 'base'}))

            return {
                entry,
                works,
                error: result.error,
            }
        }))

        const groups = loadedGroups
            .filter(({works}) => works.length > 0)
            .map(({entry, works}) => ({
                catalogue: entry.catalogue,
                catalogueName: entry.catalogueName || entry.catalogue,
                composerName: entry.composerAliases[locale] || entry.composerName,
                composerNameSort: entry.composerNameSort,
                composerQid: entry.composerQid,
                works,
            }))
            .sort((left, right) => left.composerName.localeCompare(right.composerName, undefined, {sensitivity: 'base'}))

        return {groups, error: loadedGroups.some(({error}) => error)}
    } catch (error) {
        console.error('[getGenreWorksSafe] Failed to load works:', error)
        return {groups: [], error: true}
    }
}

export async function getWorksByWikiID(wikiID: string) {
    const directory = await getCatalogueDirectory()
    const loaded = await Promise.all(directory.map(async entry => ({
        entry,
        works: (await getCatalogWorksSafe(entry.catalogue)).works,
    })))
    return loaded.flatMap(({entry, works}) => works
        .filter(work => work.details.WikiQID?.trim() === wikiID)
        .map(work => ({entry, work})))
}

export type WikiBannerItem = {
    kind: 'composer' | 'genre' | 'work'
    title: string
    subtitle?: string
    wikiID: string
    href: string
}

function pickRandom<T>(items: readonly T[]): T | undefined {
    return items[Math.floor(Math.random() * items.length)]
}

async function pickRandomComposer(locale: Locale): Promise<WikiBannerItem | null> {
    const directory = await getCatalogueDirectory()
    const candidates = directory.map(entry => ({entry, wikiID: entry.composerQid}))
    const pick = pickRandom(candidates)
    if (!pick) return null

    return {
        kind: 'composer',
        title: pick.entry.composerAliases[locale] || pick.entry.composerName,
        wikiID: pick.wikiID,
        href: localePath(locale, `/composers/${encodeURIComponent(pick.entry.composerQid)}`),
    }
}

async function pickRandomGenre(locale: Locale): Promise<WikiBannerItem | null> {
    const links = Object.values(await getGenreLinks()).filter(link => link.wikiID)
    const pick = pickRandom(links)
    if (!pick?.wikiID) return null

    return {
        kind: 'genre',
        title: getLocalizedWorkTerm(pick.name, 'type', locale),
        wikiID: pick.wikiID,
        href: localePath(locale, pick.path),
    }
}

async function pickRandomWork(locale: Locale): Promise<WikiBannerItem | null> {
    const directory = await getCatalogueDirectory()
    const loaded = await Promise.all(directory.map(async entry => ({
        entry,
        works: (await getCatalogWorksSafe(entry.catalogue)).works,
    })))
    const candidates = loaded.flatMap(({entry, works}) => works.flatMap(work => {
        const wikiID = work.details.WikiQID?.trim()
        return wikiID && work.title.trim() ? [{entry, work, wikiID}] : []
    }))
    const pick = pickRandom(candidates)
    if (!pick) return null

    const composerName = pick.entry.composerAliases[locale] || pick.entry.composerName
    return {
        kind: 'work',
        title: pick.work.title,
        subtitle: `${composerName} · ${pick.work.catalogue}`,
        wikiID: pick.wikiID,
        href: localePath(locale, `/catalogues/${encodeURIComponent(pick.entry.catalogue)}`),
    }
}

export async function getRandomWikiBannerItems(locale: Locale): Promise<WikiBannerItem[]> {
    const [composer, genre, work] = await Promise.all([
        pickRandomComposer(locale),
        pickRandomGenre(locale),
        pickRandomWork(locale),
    ])
    const items = [composer, genre, work]
    return items.filter((item): item is WikiBannerItem => item !== null)
}
