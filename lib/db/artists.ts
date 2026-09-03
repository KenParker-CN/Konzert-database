import 'server-only'

import { getDatabase } from './sqlite'

export type Artist = { artistId: number; name: string; nameSort: string | null; type: string; startDate: string | null; endDate: string | null; workCount: number }

export function getArtists(search?: string): Artist[] {
  const db = getDatabase()
  try {
    return db.prepare(`
      SELECT a.artist_id AS artistId, a.name, a.name_sort AS nameSort, a.type,
        a.start_date AS startDate, a.end_date AS endDate, COUNT(DISTINCT wc.work_id) AS workCount
      FROM artists a LEFT JOIN work_composers wc ON wc.artist_id = a.artist_id
      ${search?.trim() ? 'WHERE a.name LIKE @search' : ''}
      GROUP BY a.artist_id ORDER BY COALESCE(a.name_sort, a.name)
    `).all(search?.trim() ? { search: `%${search.trim()}%` } : {}) as Artist[]
  } finally { db.close() }
}
