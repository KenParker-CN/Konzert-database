import 'server-only'

import { getComposers as loadComposers, getComposerWorks as loadComposerWorks } from '@/lib/data/csv-loader'
import { getCatalogForComposer, hiddenCatalogues } from '@/lib/data/composer-catalog-map'
import {getPostgresCatalogueWorkCount, getPostgresCatalogueWorks} from '@/lib/data/postgres'

export type ComposerAliases = {
    org: string
    en: string
    de: string
    fr: string
    ja: string
    zh: string
}

export type Composer = {
    artistId: number
    slug: string
    name: string
    nameSort: string | null
    aliases: ComposerAliases
    nationalities: string[]
    type: string
    artistCategory: string
    startDate: string | null
    endDate: string | null
    biography: string | null
    workCount: number
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

export async function getComposers(search?: string): Promise<Composer[]> {
    let composers = await loadComposers()

    if (search?.trim()) {
        const searchLower = search.trim().toLowerCase()
        composers = composers.filter(c =>
            [c.name, ...Object.values(c.aliases)].some(name => name.toLowerCase().includes(searchLower)),
        )
    }

    return composers
}

export async function getComposer(slug: string) {
    const composers = await getComposers()
    return composers.find(composer => composer.slug === slug) ?? null
}

export async function getComposerSlugMap(): Promise<Record<string, string>> {
    const map: Record<string, string> = {}
    for (const composer of await getComposers()) map[composer.name] = composer.slug
    return map
}

export async function getCatalogueDirectory() {
    const composers = await loadComposers()
    const catalogueEntries = composers.flatMap(composer => {
        const catalogue = getCatalogForComposer(composer.slug)
        return catalogue && !hiddenCatalogues.has(catalogue) ? [{composer, catalogue}] : []
    })

    return Promise.all(catalogueEntries.map(async ({composer, catalogue}) => {
        let workCount = 0
        try {
            workCount = catalogue === 'RV'
                ? await getPostgresCatalogueWorkCount(catalogue)
                : (await loadComposerWorks(catalogue)).length
        } catch {
            workCount = 0
        }

        return {
            catalogue,
            composerName: composer.name,
            composerAliases: composer.aliases,
            composerSlug: composer.slug,
            workCount,
        }
    }))
}

export async function getComposerWorks(artistId: number): Promise<ComposerWork[]> {
    const composers = await getComposers()
    const composer = composers.find(c => c.artistId === artistId)
    if (!composer) return []

    const catalogCode = getCatalogForComposer(composer.slug)
    if (!catalogCode) return []

    const works = catalogCode === 'RV'
        ? await getPostgresCatalogueWorks(catalogCode)
        : await loadComposerWorks(catalogCode)
    return works.map(w => ({
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
    }))
}

/** Load catalogue works without throwing — used by streaming works panels. */
export async function getComposerWorksSafe(artistId: number): Promise<{
    works: ComposerWork[]
    error: boolean
}> {
    try {
        return {works: await getComposerWorks(artistId), error: false}
    } catch {
        return {works: [], error: true}
    }
}

export async function getCatalogWorksSafe(catalogCode: string): Promise<{
    works: ComposerWork[]
    error: boolean
}> {
    try {
        const works = catalogCode === 'RV'
            ? await getPostgresCatalogueWorks(catalogCode)
            : await loadComposerWorks(catalogCode)
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
    } catch {
        return {works: [], error: true}
    }
}
