import 'server-only'

import {getDatabase} from './sqlite'

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

export function getArtists(search?: string, category?: string): Artist[] {
    const db = getDatabase()
    try {
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

        return db.prepare(`
            SELECT a.artist_id                AS artistId,
                   a.name,
                   a.name_sort                AS nameSort,
                   a.type,
                   a.artist_category          AS artistCategory,
                   a.start_date               AS startDate,
                   a.end_date                 AS endDate,
                   a.biography,
                   COUNT(DISTINCT wc.work_id) AS workCount,
                   COUNT(DISTINCT rp.recording_id) AS recordingCount
            FROM artists a
                     LEFT JOIN work_composers wc ON wc.artist_id = a.artist_id
                     LEFT JOIN recording_performers rp ON rp.artist_id = a.artist_id
             ${whereClause}
            GROUP BY a.artist_id
            ORDER BY a.name
        `).all(params) as Artist[]
    } finally {
        db.close()
    }
}

export function getArtistCategories(): string[] {
    const db = getDatabase()
    try {
        const rows = db.prepare(`
            SELECT DISTINCT artist_category
            FROM artists
            WHERE COALESCE(artist_category, '') != 'classical'
            AND artist_category IS NOT NULL
            ORDER BY artist_category
        `).all() as Array<{ artist_category: string }>
        return rows.map(row => row.artist_category)
    } finally {
        db.close()
    }
}

export function artistSlug(name: string) {
    return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function getArtist(slug: string) {
    const db = getDatabase()
    try {
        const rows = db.prepare(`
            SELECT a.artist_id AS artistId, a.name, a.name_sort AS nameSort, a.type,
                   a.artist_category AS artistCategory, a.start_date AS startDate,
                   a.end_date AS endDate, a.biography,
                   COUNT(DISTINCT wc.work_id) AS workCount,
                   COUNT(DISTINCT rp.recording_id) AS recordingCount
            FROM artists a
            LEFT JOIN work_composers wc ON wc.artist_id = a.artist_id
            LEFT JOIN recording_performers rp ON rp.artist_id = a.artist_id
            GROUP BY a.artist_id
            ORDER BY a.name
        `).all() as Artist[]
        return rows.find(a => artistSlug(a.name) === slug) ?? null
    } finally {
        db.close()
    }
}

/** name → slug lookup, used to link album credits to artist detail pages. */
export function getArtistSlugMap(): Record<string, string> {
    const db = getDatabase()
    try {
        const rows = db.prepare('SELECT name FROM artists ORDER BY name').all() as Array<{ name: string }>
        const map: Record<string, string> = {}
        for (const row of rows) map[row.name] = artistSlug(row.name)
        return map
    } finally {
        db.close()
    }
}

export function getArtistWorks(artistId: number): ArtistWork[] {
    const db = getDatabase()
    try {
        return db.prepare(`
            SELECT w.work_id            AS workId,
                   w.catalog_no         AS catalogue,
                   w.title,
                   COALESCE(w.type, '') AS type,
                   COALESCE(w.key_signature, '') AS key,
        COALESCE(w.instrumentation, '') AS instrumentation
            FROM work_composers wc INNER JOIN works w
            ON w.work_id = wc.work_id
            WHERE wc.artist_id = @artistId
            ORDER BY w.work_id
        `).all({artistId}) as ArtistWork[]
    } finally {
        db.close()
    }
}

/**
 * Roles are derived from real database relations (never fabricated):
 * - work_composers        → Composer
 * - recording_performers  → Performer
 * - artist_roles          → additional custom roles
 */
export function getArtistRoles(artistId: number): string[] {
    const db = getDatabase()
    try {
        const composer = db.prepare('SELECT COUNT(*) AS c FROM work_composers WHERE artist_id = @id').get({id: artistId}) as {
            c: number
        }
        const performer = db.prepare('SELECT COUNT(*) AS c FROM recording_performers WHERE artist_id = @id').get({id: artistId}) as {
            c: number
        }
        const custom = db.prepare('SELECT role FROM artist_roles WHERE artist_id = @id').all({id: artistId}) as Array<{
            role: string | null
        }>

        const roles: string[] = []
        if (composer.c > 0) roles.push('Composer')
        if (performer.c > 0) roles.push('Performer')
        for (const row of custom) {
            if (row.role && !roles.includes(row.role)) roles.push(row.role)
        }
        return roles
    } finally {
        db.close()
    }
}

export function getArtistRecordings(artistId: number): ArtistRecording[] {
    const db = getDatabase()
    try {
        return db.prepare(`
            SELECT r.recording_id AS recordingId, r.title, r.recording_date AS recordingDate
            FROM recording_performers rp
                     INNER JOIN recordings r ON r.recording_id = rp.recording_id
            WHERE rp.artist_id = @artistId
            ORDER BY r.title
        `).all({artistId}) as ArtistRecording[]
    } finally {
        db.close()
    }
}
