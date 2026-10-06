import 'server-only'

import { getComposers as loadComposers, getComposerWorks as loadComposerWorks } from '@/lib/data/csv-loader'
import { getCatalogForComposer } from '@/lib/data/composer-catalog-map'

export type Composer = {
    artistId: number
    slug: string
    name: string
    nameSort: string | null
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
        composers = composers.filter(c => c.name.toLowerCase().includes(searchLower))
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
        return catalogue ? [{composer, catalogue}] : []
    })

    return Promise.all(catalogueEntries.map(async ({composer, catalogue}) => ({
        catalogue,
        composerName: composer.name,
        composerSlug: composer.slug,
        workCount: (await loadComposerWorks(catalogue)).length,
    })))
}

export async function getComposerWorks(artistId: number): Promise<ComposerWork[]> {
    const composers = await getComposers()
    const composer = composers.find(c => c.artistId === artistId)
    if (!composer) return []

    const catalogCode = getCatalogForComposer(composer.slug)
    if (!catalogCode) return []

    const works = await loadComposerWorks(catalogCode)
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
