import 'server-only'

import { getDatabase } from './sqlite'

export type Artist = { artistId: number; name: string; nameSort: string | null; type: string; startDate: string | null; endDate: string | null; biography: string | null; workCount: number }

export function getArtists(search?: string): Artist[] {
  const db = getDatabase()
  try {
    return db.prepare(`
      SELECT a.artist_id AS artistId, a.name, a.name_sort AS nameSort, a.type,
        a.start_date AS startDate, a.end_date AS endDate, a.biography, COUNT(DISTINCT wc.work_id) AS workCount
      FROM artists a LEFT JOIN work_composers wc ON wc.artist_id = a.artist_id
      ${search?.trim() ? 'WHERE a.name LIKE @search' : ''}
      GROUP BY a.artist_id ORDER BY COALESCE(a.name_sort, a.name)
    `).all(search?.trim() ? { search: `%${search.trim()}%` } : {}) as Artist[]
  } finally { db.close() }
}

export function artistSlug(name: string) { return name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }

export function getArtist(slug: string) { return getArtists().find(artist => artistSlug(artist.name) === slug) ?? null }

export function getArtistWorks(artistId: number) {
  const db = getDatabase()
  try {
    return db.prepare(`SELECT w.work_id AS workId, w.catalog_no AS catalogue, w.title, COALESCE(w.type, '') AS type FROM work_composers wc INNER JOIN works w ON w.work_id = wc.work_id WHERE wc.artist_id = @artistId ORDER BY w.work_id`).all({ artistId }) as Array<{ workId: number; catalogue: string; title: string; type: string }>
  } finally { db.close() }
}
