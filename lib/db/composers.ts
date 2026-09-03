import 'server-only'

import { getDatabase } from './sqlite'

export type Composer = {
  artistId: number
  slug: string
  name: string
  nameSort: string | null
  type: string
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

export function getComposers(search?: string): Composer[] {
  const db = getDatabase()
  try {
    const rows = db.prepare(`
      SELECT a.artist_id AS artistId, a.name, a.name_sort AS nameSort, a.type,
        a.start_date AS startDate, a.end_date AS endDate, a.biography,
        COUNT(DISTINCT wc.work_id) AS workCount
      FROM artists a
      LEFT JOIN work_composers wc ON wc.artist_id = a.artist_id
      ${search?.trim() ? 'WHERE a.name LIKE @search' : ''}
      GROUP BY a.artist_id
      ORDER BY COALESCE(a.name_sort, a.name)
    `).all(search?.trim() ? { search: `%${search.trim()}%` } : {}) as Omit<Composer, 'slug'>[]
    return rows.map(row => ({ ...row, slug: slugify(row.name) }))
  } finally {
    db.close()
  }
}

export function getComposer(slug: string): Composer | null {
  return getComposers().find(composer => composer.slug === slug) ?? null
}

export function getComposerWorks(artistId: number): ComposerWork[] {
  const db = getDatabase()
  try {
    return db.prepare(`
      SELECT w.work_id AS workId, w.catalog_no AS catalogue, w.title,
        COALESCE(w.type, '') AS type, COALESCE(w.key_signature, '') AS key,
        COALESCE(w.instrumentation, '') AS instrumentation
      FROM artists a
      INNER JOIN work_composers wc ON wc.artist_id = a.artist_id
      INNER JOIN works w ON w.work_id = wc.work_id
      WHERE a.artist_id = @artistId
      ORDER BY w.work_id
    `).all({ artistId }) as ComposerWork[]
  } finally {
    db.close()
  }
}
