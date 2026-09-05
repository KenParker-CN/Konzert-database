import 'server-only'

import { getDatabase } from './sqlite'

export type Artist = {
    artistId: number;
    name: string;
    nameSort: string | null;
    type: string;
    artistCategory: string;
    startDate: string | null;
    endDate: string | null;
    biography: string | null;
    workCount: number;
    recordingCount: number
}

export type ArtistWork = {
    workId: number;
    catalogue: string;
    title: string;
    type: string;
    key: string;
    instrumentation: string
}

export type ArtistRecording = { recordingId: number; title: string; recordingDate: string | null }

export async function getArtists(search?: string, category?: string): Promise<Artist[]> {
    const db = getDatabase()
    let whereClause = "WHERE COALESCE(a.artist_category, '') != 'classical'"
    const params: Record<string, string> = {}

    if (search?.trim()) {
        whereClause += " AND a.name LIKE @search"
        params.search = `%${search.trim()}%`
    }

    if (category?.trim()) {
        whereClause += " AND a.artist_category = @category"
        params.category = category
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
                   (SELECT COUNT(*) FROM works w WHERE w.composer_id = a.artist_id) AS workCount,
                   COUNT(DISTINCT rp.recording_id) AS recordingCount
            FROM artists a
                     LEFT JOIN recording_performers rp ON rp.artist_id = a.artist_id
             ${whereClause}
            GROUP BY a.artist_id
            ORDER BY a.name
        `,
        args: params,
    })
    return result.rows as unknown as Artist[]
}

export async function getArtistCategories(): Promise<string[]> {
    const db = getDatabase()
    const result = await db.execute(`
        SELECT DISTINCT artist_category
        FROM artists
        WHERE COALESCE(artist_category, '') != 'classical'
        AND artist_category IS NOT NULL
        ORDER BY artist_category
    `)
    return (result.rows as unknown as Array<{ artist_category: string }>).map(row => row.artist_category)
}

export function artistSlug(name: string) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function getArtist(slug: string) {
    const db = getDatabase()
    const result = await db.execute(`
        SELECT a.artist_id AS artistId, a.name, a.name_sort AS nameSort, a.type,
               a.artist_category AS artistCategory, a.start_date AS startDate,
               a.end_date AS endDate, a.biography,
               (SELECT COUNT(*) FROM works w WHERE w.composer_id = a.artist_id) AS workCount,
               COUNT(DISTINCT rp.recording_id) AS recordingCount
        FROM artists a
        LEFT JOIN recording_performers rp ON rp.artist_id = a.artist_id
        GROUP BY a.artist_id
        ORDER BY a.name
    `)
    const rows = result.rows as unknown as Artist[]
    return rows.find(a => artistSlug(a.name) === slug) ?? null
}

export async function getArtistSlugMap(): Promise<Record<string, string>> {
    const db = getDatabase()
    const result = await db.execute('SELECT name FROM artists ORDER BY name')
    const rows = result.rows as unknown as Array<{ name: string }>
    const map: Record<string, string> = {}
    for (const row of rows) map[row.name] = artistSlug(row.name)
    return map
}

export async function getArtistWorks(artistId: number): Promise<ArtistWork[]> {
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
    return result.rows as unknown as ArtistWork[]
}

export async function getArtistRoles(artistId: number): Promise<string[]> {
    const db = getDatabase()
    const composerResult = await db.execute({
        sql: 'SELECT COUNT(*) AS c FROM works WHERE composer_id = @id',
        args: { id: artistId },
    })
    const composer = composerResult.rows[0] as unknown as { c: number }

    const performerResult = await db.execute({
        sql: 'SELECT COUNT(*) AS c FROM recording_performers WHERE artist_id = @id',
        args: { id: artistId },
    })
    const performer = performerResult.rows[0] as unknown as { c: number }

    const customResult = await db.execute({
        sql: 'SELECT role FROM artist_roles WHERE artist_id = @id',
        args: { id: artistId },
    })
    const custom = customResult.rows as unknown as Array<{ role: string | null }>

    const roles: string[] = []
    if (composer.c > 0) roles.push('Composer')
    if (performer.c > 0) roles.push('Performer')
    for (const row of custom) {
        if (row.role && !roles.includes(row.role)) roles.push(row.role)
    }
    return roles
}

export async function getArtistRecordings(artistId: number): Promise<ArtistRecording[]> {
    const db = getDatabase()
    const result = await db.execute({
        sql: `
            SELECT r.recording_id AS recordingId, r.title, r.recording_date AS recordingDate
            FROM recording_performers rp
                     INNER JOIN recordings r ON r.recording_id = rp.recording_id
            WHERE rp.artist_id = @artistId
            ORDER BY r.title
        `,
        args: { artistId },
    })
    return result.rows as unknown as ArtistRecording[]
}
