export interface CatalogueDefinition {
  id: string
  name: string
  composer: string
  composerSlug: string
}

export const catalogues: CatalogueDefinition[] = [
  {
    id: 'RV',
    name: 'Ryom-Verzeichnis',
    composer: 'Antonio Vivaldi',
    composerSlug: 'vivaldi'
  },
  {
    id: 'TWV',
    name: 'Telemann-Werke-Verzeichnis',
    composer: 'Georg Philipp Telemann',
    composerSlug: 'telemann'
  },
  {
    id: 'HWV',
    name: 'Handel-Werke-Verzeichnis',
    composer: 'George Frideric Handel',
    composerSlug: 'handel'
  },
  {
    id: 'KV',
    name: 'Köchel-Verzeichnis',
    composer: 'Wolfgang Amadeus Mozart',
    composerSlug: 'mozart'
  },
  {
    id: 'BWV',
    name: 'Bach-Werke-Verzeichnis',
    composer: 'Johann Sebastian Bach',
    composerSlug: 'bach'
  }
]

export const catalogueIds = catalogues.map(
    catalogue => catalogue.id
)

export function cataloguesByComposerSlug(
    slug: string
): CatalogueDefinition[] {
  return catalogues.filter(
      catalogue => catalogue.composerSlug === slug
  )
}

export function catalogueLink(id: string): string {
  return `/catalogues?tab=${id}`
}


/* =========================================================
   Catalogue data
   ========================================================= */

export interface Work {
  [key: string]: string
}

export interface CatalogueData {
  headers: string[]
  works: Work[]
}


/* =========================================================
   Filters
   ========================================================= */

export interface FilterField {
  field: string
  label: string
  tokenised: boolean
}

export interface FilterOption {
  value: string
  count: number
}

export interface FilterGroup
    extends FilterField {
  options: FilterOption[]
}

export type FilterSelection =
    Record<string, string[]>


// 所有目录统一使用这三个筛选器
const FILTER_FIELDS = [
  'Type',
  'Key',
  'Instrumentation'
]

const MAX_FILTER_OPTIONS = 100


/* =========================================================
   CSV loading
   ========================================================= */

export async function loadCatalogue(
    id: string
): Promise<CatalogueData> {
  const response = await fetch(
      `/data/${id.toLowerCase()}.csv`
  )

  if (!response.ok) {
    throw new Error(
        `Failed to load catalogue: ${id}`
    )
  }

  const text = await response.text()

  return parseCSV(text)
}


/* =========================================================
   CSV parser
   ========================================================= */

export function parseCSV(text: string): CatalogueData {
  const rows: string[][] = []

  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"'
        i++
      } else {
        quoted = !quoted
      }

      continue
    }

    if (char === ',' && !quoted) {
      row.push(cell)
      cell = ''
      continue
    }

    if (
        (char === '\n' || char === '\r') &&
        !quoted
    ) {
      if (char === '\r' && next === '\n') {
        i++
      }

      row.push(cell)
      cell = ''

      if (
          row.length > 1 ||
          row[0]?.trim()
      ) {
        rows.push(row)
      }

      row = []
      continue
    }

    cell += char
  }

  row.push(cell)

  if (
      row.length > 1 ||
      row[0]?.trim()
  ) {
    rows.push(row)
  }

  const headers = rows[0] || []

  const works = rows
      .slice(1)
      .map(values => {
        const work: Work = {}

        headers.forEach(
            (header, index) => {
              work[header] =
                  values[index] || ''
            }
        )

        return work
      })

  return {
    headers,
    works
  }
}


/* =========================================================
   Filter field detection
   ========================================================= */

export function detectFilterFields(
    headers: string[],
    works: Work[]
): FilterField[] {
  return FILTER_FIELDS.flatMap(
      fieldName => {
        // 不区分 CSV 表头大小写
        const header = headers.find(
            header =>
                header.toLowerCase() ===
                fieldName.toLowerCase()
        )

        if (!header) {
          return []
        }

        const raw = works
            .map(work =>
                (work[header] || '').trim()
            )
            .filter(Boolean)

        if (!raw.length) {
          return []
        }

        const instrumentation =
            fieldName.toLowerCase() ===
            'instrumentation'

        const tokenised = true

        const field: FilterField = {
          field: header,
          label: humanise(header),
          tokenised
        }

        const distinct = new Set(
            raw.flatMap(value =>
                tokenised
                    ? splitValues(
                        value,
                        instrumentation
                    )
                    : [value]
            )
        )

        // 没有至少两个选项，就不显示这个筛选器
        if (distinct.size < 2) {
          return []
        }

        // 非 Instrumentation 的选项太多就不作为筛选器
        if (
            !instrumentation &&
            distinct.size > MAX_FILTER_OPTIONS
        ) {
          return []
        }

        return [field]
      }
  )
}


/* =========================================================
   Split filter values
   ========================================================= */

function splitValues(
    raw: string,
    instrumentation = false
): string[] {
  let values: string[]

  if (instrumentation) {
    // Instrumentation:
    // , + / 都作为分隔符
    // (...) 内容去掉
    // [] 去掉
    values = raw
        .replace(/\s*\([^)]*\)/g, '')
        .replace(/[\[\]]/g, '')
        .split(/[,+/]/)
  } else {
    // Type / Key:
    // , / 都作为分隔符
    values = raw.split(/[,/]/)
  }

  values = values
      .map(value => value.trim())
      .filter(Boolean)

  // 去重，同时保留原始写法
  return [
    ...new Map(
        values.map(value => [
          value.toLocaleLowerCase(),
          value
        ])
    ).values()
  ]
}

/* =========================================================
   Get values from a work
   ========================================================= */

export function valuesOf(
    work: Work,
    field: FilterField
): string[] {
  const raw = (
      work[field.field] || ''
  ).trim()

  if (!raw) {
    return []
  }

  return field.tokenised
      ? splitValues(
          raw,
          /instrumentation/i.test(
              field.field
          )
      )
      : [raw]
}


/* =========================================================
   Humanise header
   ========================================================= */

function humanise(
    value: string
): string {
  return value
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
}


/* =========================================================
   Search
   ========================================================= */

function matchesSearch(
    work: Work,
    query: string
): boolean {
  if (!query.trim()) {
    return true
  }

  const normalized =
      query.trim().toLowerCase()

  return Object.values(work).some(
      value =>
          value
              .toLowerCase()
              .includes(normalized)
  )
}


/* =========================================================
   Match one filter field
   ========================================================= */

function matchesField(
    work: Work,
    field: FilterField,
    selected: string[]
): boolean {
  if (!selected.length) {
    return true
  }

  const values = valuesOf(
      work,
      field
  )

  // 同一个筛选器里的多个选项 = AND
  //
  // 例如：
  // ob + vl + vlc
  //
  // 必须同一条作品同时包含：
  // ob
  // vl
  // vlc
  //
  // 否则不匹配
  return selected.every(
      value => values.includes(value)
  )
}


/* =========================================================
   Apply filters
   ========================================================= */

export function applyFilters(
    works: Work[],
    fields: FilterField[],
    selection: FilterSelection,
    query = '',
    ignoreField = ''
): Work[] {
  return works.filter(work => {
    // 搜索
    if (
        !matchesSearch(work, query)
    ) {
      return false
    }

    // 不同筛选器之间也是 AND
    return fields.every(field => {
      // 计算当前筛选器的 options 时，
      // 忽略当前这个 field 本身
      if (
          field.field === ignoreField
      ) {
        return true
      }

      return matchesField(
          work,
          field,
          selection[field.field] || []
      )
    })
  })
}


/* =========================================================
   Build filter groups
   ========================================================= */

export function buildFilterGroups(
    works: Work[],
    fields: FilterField[],
    selection: FilterSelection,
    query = ''
): FilterGroup[] {
  return fields.map(field => {
    /*
     * 计算这个筛选器的选项数量时，
     * 忽略这个筛选器自己的选择，
     * 但保留其他筛选器的条件。
     */
    const scope = applyFilters(
        works,
        fields,
        selection,
        query,
        field.field
    )

    const counts =
        new Map<string, number>()

    for (const work of scope) {
      for (
          const value of valuesOf(
          work,
          field
      )
          ) {
        counts.set(
            value,
            (counts.get(value) || 0) + 1
        )
      }
    }

    /*
     * 已经选择的选项即使当前数量为 0，
     * 也必须保留下来。
     */
    for (
        const value of
    selection[field.field] || []
        ) {
      if (!counts.has(value)) {
        counts.set(value, 0)
      }
    }

    const options =
        [...counts.entries()]
            .map(
                ([value, count]) => ({
                  value,
                  count
                })
            )
            .sort(
                (a, b) =>
                    b.count - a.count ||
                    a.value.localeCompare(
                        b.value,
                        'en',
                        {
                          numeric: true
                        }
                    )
            )

    /*
     * 注意：
     *
     * 这里不要再写：
     *
     * .filter(group => group.options.length > 0)
     *
     * 否则筛选结果为 0 时，
     * 其他筛选器会直接消失。
     */
    return {
      ...field,
      options
    }
  })
}