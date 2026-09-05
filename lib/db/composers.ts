import 'server-only'

import { getDatabase } from './sqlite'
import { COMPOSER_YEAR_MAX, COMPOSER_YEAR_MIN } from '@/lib/composer-years'

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

function slugify(name: string) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function getComposers(search?: string, fromYear?: number | null, toYear?: number | null): Promise<Composer[]> {
    const db = getDatabase()
    let whereClause = "WHERE a.artist_category = 'classical'"
    const params: Record<string, any> = {}

    if (search?.trim()) {
        whereClause += " AND a.name LIKE @search"
        params.search = `%${search.trim()}%`
    }

    const hasFrom = typeof fromYear === 'number' && Number.isFinite(fromYear)
    const hasTo = typeof toYear === 'number' && Number.isFinite(toYear)
    if (hasFrom || hasTo) {
        const minYear = hasFrom ? fromYear : COMPOSER_YEAR_MIN
        const maxYear = hasTo ? toYear : COMPOSER_YEAR_MAX
        if (minYear > COMPOSER_YEAR_MIN || maxYear < COMPOSER_YEAR_MAX) {
            whereClause += " AND CAST(SUBSTR(a.start_date, 1, 4) AS INTEGER) >= @minYear AND CAST(SUBSTR(a.start_date, 1, 4) AS INTEGER) <= @maxYear"
            params.minYear = minYear
            params.maxYear = maxYear
        }
    }

    const result = await db.execute({
        sql: `
            SELECT a.artist_id                AS artistId,
                   a.name,
                   a.name_sort                AS nameSort,
                   a.type,
                   a.artist_category          AS artistCategory,
                   a.start_date               AS startDate,
                   a.end_date                 AS endDate,
                   a.biography,
                   (SELECT COUNT(*) FROM works w WHERE w.composer_id = a.artist_id) AS workCount
            FROM artists a
             ${whereClause}
            GROUP BY a.artist_id
            ORDER BY a.name
        `,
        args: params,
    })
    const rows = result.rows as unknown as Omit<Composer, 'slug'>[]
    return rows.map(row => ({ ...row, slug: slugify(row.name) }))
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
    const db = getDatabase()
    const result = await db.execute({
        sql: `
            SELECT w.work_id            AS workId,
                   w.catalog_no         AS catalogue,
                   w.title,
                   COALESCE(w.type, '') AS type,
                   COALESCE(w.key_signature, '') AS key,
                   COALESCE(w.instrumentation, '') AS instrumentation
            FROM works w
            WHERE w.composer_id = @artistId
            ORDER BY w.work_id
        `,
        args: { artistId },
    })
    return result.rows as unknown as ComposerWork[]
}
