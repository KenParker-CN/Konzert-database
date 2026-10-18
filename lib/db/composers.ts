import 'server-only'

import { getComposers as loadComposers, getComposerWorks as loadComposerWorks } from '@/lib/data/csv-loader'
import { getCatalogForComposer } from '@/lib/data/composer-catalog-map'

const CATALOGUE_DIRECTORY_CACHE_TTL_MS = 5 * 60 * 1000
let catalogueDirectoryCache: {
    expiresAt: number
    request: Promise<ReturnType<typeof getCatalogueDirectoryImpl>>
} | undefined

export type ComposerAliases = {
    org: string
    en: string
    de: string
    fr: string
    ja: string
    zh: string
}
export type ComposerWork = {
    workId: number
    catalogue: string
    opus: string
    secondaryCatalogue: string
    date: string
    title: string
    type: string
    key: string
    instrumentation: string
    details: Record<string, string>
}

export async function getComposer(slug: string) {
    const composers = await loadComposers()
    return composers.find(composer => composer.slug === slug) ?? null
}

async function getCatalogueDirectoryImpl() {
    const composers = await loadComposers()
    const catalogueEntries = composers.flatMap(composer => {
        const catalogue = getCatalogForComposer(composer.slug)
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
            composerName: composer.name,
            composerAliases: composer.aliases,
            composerSlug: composer.slug,
            workCount,
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
                catalogue: w.catalogue,
                opus: w.opus,
                secondaryCatalogue: w.secondaryCatalogue,
                date: w.date,
                title: w.title,
                type: w.type,
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
