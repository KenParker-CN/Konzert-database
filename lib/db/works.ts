import 'server-only'

import { getDatabase } from './sqlite'

export type Work = {
  workId: number
  catalogue: string
  number: string
  title: string
  composer: string
  type: string
  key: string
  instrumentation: string
}

export type WorkFilters = {
  search?: string
  catalogue?: string
  type?: string
  key?: string
  instrumentation?: string
}

export type WorkFilterOptions = Record<Exclude<keyof WorkFilters, 'search'>, string[]>

type WorkRow = Omit<Work, 'composer'> & { composer: string | null }

const baseQuery = `
  SELECT
    w.work_id AS workId,
    COALESCE(substr(w.catalog_no, 1, instr(w.catalog_no || ' ', ' ') - 1), w.catalog_no, '') AS catalogue,
    CASE
      WHEN instr(w.catalog_no || ' ', ' ') > 0 THEN trim(substr(w.catalog_no, instr(w.catalog_no || ' ', ' ') + 1))
      ELSE ''
    END AS number,
    w.title,
    a.name AS composer,
    COALESCE(w.type, '') AS type,
    COALESCE(w.key_signature, '') AS key,
    COALESCE(w.instrumentation, '') AS instrumentation
  FROM works w
  LEFT JOIN artists a ON a.artist_id = w.composer_id
`

function clean(value?: string) {
  return value?.trim() || undefined
}

export function getWorks(filters: WorkFilters = {}): Work[] {
  const db = getDatabase()
  try {
    const search = clean(filters.search)
    const catalogue = clean(filters.catalogue)
    const type = clean(filters.type)
    const key = clean(filters.key)
    const instrumentation = clean(filters.instrumentation)
    const clauses: string[] = []
    const params: Record<string, string> = {}

    if (search) {
      clauses.push(`(w.title LIKE @search OR w.catalog_no LIKE @search OR a.name LIKE @search OR w.type LIKE @search OR w.key_signature LIKE @search OR w.instrumentation LIKE @search)`)
      params.search = `%${search}%`
    }
    if (catalogue) {
      clauses.push(`w.catalog_no LIKE @catalogue`)
      params.catalogue = `${catalogue}%`
    }
    if (type) {
      clauses.push(`w.type = @type`)
      params.type = type
    }
    if (key) {
      clauses.push(`w.key_signature = @key`)
      params.key = key
    }
    if (instrumentation) {
      clauses.push(`w.instrumentation LIKE @instrumentation`)
      params.instrumentation = `%${instrumentation}%`
    }

    const rows = db.prepare(`${baseQuery}${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY w.work_id`).all(params) as WorkRow[]
    const works = rows.map(row => ({ ...row, composer: row.composer ?? 'Unknown' }))
    // Default order: full catalogue number, largest first (natural sort).
    return works.sort((a, b) => {
      const left = `${a.catalogue} ${a.number}`.trim()
      const right = `${b.catalogue} ${b.number}`.trim()
      if (!left && right) return 1
      if (left && !right) return -1
      const compared = left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
      return compared !== 0 ? -compared : a.workId - b.workId
    })
  } finally {
    db.close()
  }
}

export function getWorkFilterOptions(): WorkFilterOptions {
  const db = getDatabase()
  try {
    const rows = db.prepare(`
      SELECT
        w.catalog_no AS catalogue,
        w.type,
        w.key_signature AS key,
        w.instrumentation
      FROM works w
      ORDER BY w.work_id
    `).all() as Array<Record<keyof WorkFilterOptions, string | null>>

    return {
      catalogue: [...new Set(rows.map(row => row.catalogue?.split(/\s+/)[0]).filter(Boolean) as string[])],
      type: [...new Set(rows.map(row => row.type).filter(Boolean) as string[])],
      key: [...new Set(rows.map(row => row.key).filter(Boolean) as string[])],
      instrumentation: [...new Set(rows.map(row => row.instrumentation).filter(Boolean) as string[])],
    }
  } finally {
    db.close()
  }
}
