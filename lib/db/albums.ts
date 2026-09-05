import 'server-only'

import { getDatabase } from './sqlite'

export type Album = {
    id: string
    musicbrainzId: string
    title: string
    composers: string[]
    artists: string[]
    label: string
    catalogueNumber: string
    year: string
    genre: string
    barcode: string
    cover: string
    spotify: string
    appleMusic: string
    tidal: string
}

export function getAlbums(search?: string): Album[] {
    const db = getDatabase()
    try {
        const rows = db.prepare(`
            SELECT release_id AS tracklist_id, title, musicbrainz_id, label, catalog_number, release_date,
                   cover_dlink, strmlk_spo, strmlk_apple, strmlk_tid, genre,
                   composer_id
            FROM releases
            ORDER BY release_id
        `).all() as Array<{
            tracklist_id: number
            title: string
            musicbrainz_id: string | null
            label: string | null
            catalog_number: string | null
            release_date: string | null
            cover_dlink: string | null
            strmlk_spo: string | null
            strmlk_apple: string | null
            strmlk_tid: string | null
            genre: string | null
            composer_id: number | null
        }>

        // Get composers for each release (from release_composers junction table, fallback to releases.composer_id)
        const composersByTracklist = new Map<number, string[]>()
        const composers = db.prepare(`
            SELECT rc.release_id AS tracklist_id, a.name
            FROM release_composers rc
            JOIN artists a ON a.artist_id = rc.artist_id
            ORDER BY rc.release_id, rc.is_primary DESC, a.name
        `).all() as Array<{ tracklist_id: number; name: string }>
        for (const c of composers) {
            const list = composersByTracklist.get(c.tracklist_id) ?? []
            list.push(c.name)
            composersByTracklist.set(c.tracklist_id, list)
        }

        // Get artists/performers for each release (from release_artists junction table)
        const performersByTracklist = new Map<number, string[]>()
        const performers = db.prepare(`
            SELECT ra.release_id AS tracklist_id, a.name
            FROM release_artists ra
            JOIN artists a ON a.artist_id = ra.artist_id
            ORDER BY ra.release_id, a.name
        `).all() as Array<{ tracklist_id: number; name: string }>
        for (const p of performers) {
            const list = performersByTracklist.get(p.tracklist_id) ?? []
            list.push(p.name)
            performersByTracklist.set(p.tracklist_id, list)
        }

        // Resolve names for direct FK columns on releases (used when junction tables have no entry)
        const composerNames = new Map<number, string>()
        const composerRows = db.prepare(
            `SELECT artist_id, name FROM artists WHERE artist_id IN (
                SELECT composer_id FROM releases WHERE composer_id IS NOT NULL
            )`,
        ).all() as Array<{ artist_id: number; name: string }>
        for (const a of composerRows) composerNames.set(a.artist_id, a.name)

        const albums: Album[] = rows.map(row => {
            const junctionComposers = composersByTracklist.get(row.tracklist_id)
            const junctionArtists = performersByTracklist.get(row.tracklist_id)
            return {
                id: `album-${row.tracklist_id}`,
                musicbrainzId: row.musicbrainz_id ?? '',
                title: row.title ?? '',
                composers: junctionComposers ?? (row.composer_id != null && composerNames.has(row.composer_id) ? [composerNames.get(row.composer_id)!] : []),
                artists: junctionArtists ?? [],
                label: row.label ?? '',
                catalogueNumber: row.catalog_number ?? '',
                year: row.release_date ? row.release_date.slice(0, 4) : '',
                genre: row.genre ?? '',
                barcode: '',
                cover: row.cover_dlink ?? '',
                spotify: row.strmlk_spo ?? '',
                appleMusic: row.strmlk_apple ?? '',
                tidal: row.strmlk_tid ?? '',
            }
        })

        const query = search?.trim().toLowerCase()
        return query
            ? albums.filter(album =>
                [
                    album.title,
                    ...album.composers,
                    ...album.artists,
                    album.label,
                ].some(value =>
                    value.toLowerCase().includes(query)
                )
            )
            : albums
    } finally {
        db.close()
    }
}
