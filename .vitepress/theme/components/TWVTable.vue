<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

interface TWVWork {
  TWV: string
  Name: string
  Type: string
  Key: string
  Instrumentations: string
}

const works = ref<TWVWork[]>([])
const instrumentations = ref<string[]>([])
const searchQuery = ref('')
const selectedType = ref('')
const selectedKey = ref('')
const selectedInstrumentation = ref('')
const sortKey = ref<keyof TWVWork>('Instrumentations')
const sortAsc = ref(true)
const currentPage = ref(1)
const pageSize = 10

function parseCSV(text: string): string[][] {
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

onMounted(async () => {
  const [worksResponse, instrumentsResponse] = await Promise.all([
    fetch('/data/twv.csv'),
    fetch('/data/instrumentations.csv')
  ])
  const rows = parseCSV(await worksResponse.text())
  const headers = rows[0] || []

  works.value = rows.slice(1).map(row => {
    const data = Object.fromEntries(
        headers.map((header, index) => [header, row[index] || ''])
    )
    return {
      TWV: data.TWV,
      Name: data.Name,
      Type: data.Type,
      Key: data.Key,
      Instrumentations: data.Instrumentations
    }
  })

  const instrumentationRows = parseCSV(await instrumentsResponse.text())
  instrumentations.value = instrumentationRows
      .slice(1)
      .map(row => row[0])
      .filter(Boolean)
})

function matchesInstrumentation(
    text: string,
    instrumentation: string
) {
  const escaped = instrumentation.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
  )
  return new RegExp(
      `(^|[^a-z])${escaped}(?=$|[^a-z])`,
      'i'
  ).test(text)
}

const typeOptions = computed(() => [...new Set(
    works.value.map(work => work.Type).filter(Boolean)
)].sort((a, b) => a.localeCompare(b)).map(value => ({
  value,
  count: works.value.filter(work => work.Type === value).length
})))

const keyOptions = computed(() => [...new Set(
    works.value.map(work => work.Key).filter(Boolean)
)].sort((a, b) => a.localeCompare(b)).map(value => ({
  value,
  count: works.value.filter(work => work.Key === value).length
})))

const instrumentationOptions = computed(() => instrumentations.value.map(value => ({
  value,
  count: works.value.filter(work =>
      matchesInstrumentation(work.Instrumentations, value)
  ).length
})))

const filteredWorks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return works.value.filter(work => {
    if (selectedType.value && work.Type !== selectedType.value) return false
    if (selectedKey.value && work.Key !== selectedKey.value) return false
    if (
        selectedInstrumentation.value &&
        !matchesInstrumentation(
            work.Instrumentations,
            selectedInstrumentation.value
        )
    ) return false
    if (query && !Object.values(work).join(' ').toLowerCase().includes(query)) {
      return false
    }
    return true
  })
})

function sortBy(key: keyof TWVWork) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedWorks = computed(() => [...filteredWorks.value].sort((a, b) => {
  const result = a[sortKey.value].localeCompare(b[sortKey.value], 'en', {
    numeric: true
  })
  return sortAsc.value ? result : -result
}))

const totalPages = computed(() => Math.max(
    1,
    Math.ceil(sortedWorks.value.length / pageSize)
))

const paginatedWorks = computed(() => sortedWorks.value.slice(
    (currentPage.value - 1) * pageSize,
    currentPage.value * pageSize
))

function changePage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

function displayTWV(value: string) {
  return value.replace(/^TWV\s*/i, '')
}

function displayName(value: string) {
  return value.replace(
      /\s+in\s+[A-G](?:#|b)?\s+(?:major|minor)\s*$/i,
      ''
  )
}

watch([searchQuery, selectedType, selectedKey, selectedInstrumentation], () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="rv-table">
    <div class="filters">
      <input
          v-model="searchQuery"
          type="text"
          :placeholder="`Search ${works.length} works by TWV number, names, etc.`"
          class="search-input"
      />
    </div>

    <div class="filters">
      <select v-model="selectedType" class="filter-select">
        <option value="">Work Types</option>
        <option v-for="type in typeOptions" :key="type.value" :value="type.value">
          {{ type.value }} ({{ type.count }})
        </option>
      </select>

      <select v-model="selectedKey" class="filter-select key-select">
        <option value="">Key</option>
        <option v-for="key in keyOptions" :key="key.value" :value="key.value">
          {{ key.value }} ({{ key.count }})
        </option>
      </select>

      <select
          v-model="selectedInstrumentation"
          class="filter-select"
      >
        <option value="">Instrumentation</option>
        <option
            v-for="instrumentation in instrumentationOptions"
            :key="instrumentation.value"
            :value="instrumentation.value"
        >
          {{ instrumentation.value }} ({{ instrumentation.count }})
        </option>
      </select>
    </div>

    <div class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th @click="sortBy('TWV')">TWV <span v-if="sortKey === 'TWV'">{{ sortAsc ? '↑' : '↓' }}</span></th>
            <th @click="sortBy('Name')">Name <span v-if="sortKey === 'Name'">{{ sortAsc ? '↑' : '↓' }}</span></th>
            <th @click="sortBy('Type')">Type <span v-if="sortKey === 'Type'">{{ sortAsc ? '↑' : '↓' }}</span></th>
            <th @click="sortBy('Key')">Key <span v-if="sortKey === 'Key'">{{ sortAsc ? '↑' : '↓' }}</span></th>
            <th @click="sortBy('Instrumentations')">Instrumentations <span v-if="sortKey === 'Instrumentations'">{{ sortAsc ? '↑' : '↓' }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="work in paginatedWorks" :key="work.TWV">
            <td :title="work.TWV">{{ displayTWV(work.TWV) }}</td>
            <td
                class="truncate"
                :title="displayName(work.Name)"
            >
              {{ displayName(work.Name) }}
            </td>
            <td :title="work.Type">{{ work.Type }}</td>
            <td :title="work.Key">{{ work.Key }}</td>
            <td class="truncate" :title="work.Instrumentations">
              <span>{{ work.Instrumentations }}</span>
            </td>
          </tr>
          <tr v-if="paginatedWorks.length === 0">
            <td colspan="5" class="no-results" title="No results">No results</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">Next</button>
    </div>
  </div>
</template>
