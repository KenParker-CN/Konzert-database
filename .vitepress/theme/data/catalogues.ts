export interface CatalogueDefinition {
  id: string
  name: string
  composer: string
  composerSlug: string
}

export const catalogues: CatalogueDefinition[] = [
  { id: 'RV', name: 'Ryom-Verzeichnis', composer: 'Antonio Vivaldi', composerSlug: 'vivaldi' },
  { id: 'TWV', name: 'Telemann-Werke-Verzeichnis', composer: 'Georg Philipp Telemann', composerSlug: 'telemann' },
  { id: 'HWV', name: 'Handel-Werke-Verzeichnis', composer: 'George Frideric Handel', composerSlug: 'handel' },
  { id: 'KV', name: 'Köchel-Verzeichnis', composer: 'Wolfgang Amadeus Mozart', composerSlug: 'mozart' },
  { id: 'BWV', name: 'Bach-Werke-Verzeichnis', composer: 'Johann Sebastian Bach', composerSlug: 'bach' }
]

export const catalogueIds = catalogues.map(catalogue => catalogue.id)

export function catalogueById(id: string): CatalogueDefinition | undefined {
  return catalogues.find(catalogue => catalogue.id === id.toUpperCase())
}

export function cataloguesByComposerSlug(slug: string): CatalogueDefinition[] {
  return catalogues.filter(catalogue => catalogue.composerSlug === slug)
}

export function catalogueLink(id: string): string {
  return `/catalogues?tab=${id}`
}

export interface Work {
  [key: string]: string
}

export interface CatalogueData {
  headers: string[]
  works: Work[]
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const next = text[index + 1]
    if (char === '"') {
      if (quoted && next === '"') {
        field += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (char === ',' && !quoted) {
      row.push(field.trim())
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index++
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field.trim())
    if (row.some(Boolean)) rows.push(row)
  }
  return rows
}

export async function loadCatalogue(id: string): Promise<CatalogueData> {
  const response = await fetch(`/data/${id.toLowerCase()}.csv`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const rows = parseCSV(await response.text())
  const headers = (rows[0] || []).map(header => header.replace(/^\uFEFF/, '').trim())
  const works = rows.slice(1).map(row => Object.fromEntries(
    headers.map((header, index) => [header, row[index] || ''])
  ))
  return { headers, works }
}

/* =========================
   Filters
   ========================= */

export interface FilterField {
  field: string
  label: string
  /** Values of this field are comma separated lists that are faceted per item. */
  tokenised: boolean
}

export interface FilterOption {
  value: string
  count: number
}

export interface FilterGroup extends FilterField {
  options: FilterOption[]
}

export type FilterSelection = Record<string, string[]>

/** Maximum number of distinct values a column may have to be offered as a filter. */
const MAX_OPTIONS = 100

function splitValues(raw: string, instrumentation = false): string[] {
  const values = raw.split(',')
    .map(value => instrumentation ? value.replace(/\s*\([^)]*\)/g, '') : value)
    .map(value => value.trim())
    .filter(Boolean)
  return [...new Map(values.map(value => [value.toLocaleLowerCase(), value])).values()]
}

export function valuesOf(work: Work, field: FilterField): string[] {
  const raw = (work[field.field] || '').trim()
  if (!raw) return []
  return field.tokenised ? splitValues(raw, /instrumentation/i.test(field.field)) : [raw]
}

function humanise(header: string): string {
  return header
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\p{Ll}/gu, character => character.toUpperCase())
}

/**
 * Derives the filterable columns from the data itself: a column qualifies when
 * it holds a workable number of repeating values, so every catalogue gets the
 * filters its own CSV supports.
 */
export function detectFilterFields(headers: string[], works: Work[]): FilterField[] {
  return headers.slice(1).flatMap(header => {
    if (!header) return []

    const raw = works.map(work => (work[header] || '').trim()).filter(Boolean)
    if (!raw.length) return []

    const instrumentation = /instrumentation/i.test(header)
    const tokenised = instrumentation || raw.filter(value => value.includes(',')).length > raw.length / 2
    const field: FilterField = { field: header, label: humanise(header), tokenised }
    const distinct = new Set(raw.flatMap(value => (tokenised ? splitValues(value, instrumentation) : [value])))

    if (distinct.size < 2 || distinct.size > MAX_OPTIONS) return []
    if (distinct.size * 2 > raw.length) return []

    return [field]
  })
}

export function matchesSearch(work: Work, query: string): boolean {
  const term = query.trim().toLowerCase()
  return !term || Object.values(work).join(' ').toLowerCase().includes(term)
}

function matchesField(work: Work, field: FilterField, selected: string[]): boolean {
  if (!selected.length) return true
  const values = valuesOf(work, field)
  return selected.some(value => values.includes(value))
}

/** Applies the search query and every selection, optionally ignoring one field. */
export function applyFilters(
  works: Work[],
  fields: FilterField[],
  selection: FilterSelection,
  query = '',
  ignoreField = ''
): Work[] {
  return works.filter(work => {
    if (!matchesSearch(work, query)) return false
    return fields.every(field => {
      if (field.field === ignoreField) return true
      return matchesField(work, field, selection[field.field] || [])
    })
  })
}

/**
 * Counts every option against the works that pass the other active filters, so
 * the numbers follow the current filter state instead of the initial totals.
 */
export function buildFilterGroups(
  works: Work[],
  fields: FilterField[],
  selection: FilterSelection,
  query = ''
): FilterGroup[] {
  return fields.map(field => {
    const scope = applyFilters(works, fields, selection, query, field.field)
    const counts = new Map<string, number>()

    for (const work of scope) {
      for (const value of valuesOf(work, field)) {
        counts.set(value, (counts.get(value) || 0) + 1)
      }
    }

    for (const value of selection[field.field] || []) {
      if (!counts.has(value)) counts.set(value, 0)
    }

    const options = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, 'en', { numeric: true }))

    return { ...field, options }
  }).filter(group => group.options.length > 0)
}
