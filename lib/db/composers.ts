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
    title: string
    type: string
    key: string
    instrumentation: string
}

export async function getComposers(search?: string, fromYear?: number | null, toYear?: number | null): Promise<Composer[]> {
    const COMPOSER_YEAR_MIN = 1600
    const COMPOSER_YEAR_MAX = 2026
    
    let composers = await loadComposers()

    if (search?.trim()) {
        const searchLower = search.trim().toLowerCase()
        composers = composers.filter(c => c.name.toLowerCase().includes(searchLower))
    }

    const hasFrom = typeof fromYear === 'number' && Number.isFinite(fromYear)
    const hasTo = typeof toYear === 'number' && Number.isFinite(toYear)
    if (hasFrom || hasTo) {
        const minYear = hasFrom ? fromYear : COMPOSER_YEAR_MIN
        const maxYear = hasTo ? toYear : COMPOSER_YEAR_MAX
        composers = composers.filter(c => {
            const year = c.startDate ? parseInt(c.startDate.slice(0, 4), 10) : null
            return year !== null && year >= minYear && year <= maxYear
        })
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
        title: w.title,
        type: w.type,
        key: w.key,
        instrumentation: w.instrumentation,
    }))
}

