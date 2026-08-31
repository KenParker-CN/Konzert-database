<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type Catalogue = 'RV' | 'TWV' | 'HWV' | 'KV' | 'BWV'

interface Work {
  [key: string]: string
}

const props = defineProps<{ catalogue: Catalogue }>()

const works = ref<Work[]>([])
const headers = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selectedType = ref('')
const selectedKey = ref('')
const selectedInstrumentation = ref('')
const sortKey = ref('')
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

async function loadWorks() {
  loading.value = true
  error.value = ''
  searchQuery.value = ''
  selectedType.value = ''
  selectedKey.value = ''
  selectedInstrumentation.value = ''
  currentPage.value = 1

  try {
    const response = await fetch(`/data/${props.catalogue.toLowerCase()}.csv`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const rows = parseCSV(await response.text())
    headers.value = rows[0] || []
    works.value = rows.slice(1).map(row => Object.fromEntries(
      headers.value.map((header, index) => [header, row[index] || ''])
    ))
    sortKey.value = headers.value[0] || ''
  } catch (cause) {
    works.value = []
    headers.value = []
    error.value = `Unable to load the ${props.catalogue} catalogue.`
    console.error(cause)
  } finally {
    loading.value = false
  }
}

const typeOptions = computed(() => optionsFor('Type'))
const keyOptions = computed(() => optionsFor('Key'))
const instrumentationOptions = computed(() => optionsFor('Instrumentations'))

function optionsFor(field: string) {
  const values = works.value.map(work => work[field]).filter(Boolean)
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(value => ({
    value,
    count: values.filter(candidate => candidate === value).length
  }))
}

const filteredWorks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return works.value.filter(work => {
    if (selectedType.value && work.Type !== selectedType.value) return false
    if (selectedKey.value && work.Key !== selectedKey.value) return false
    if (selectedInstrumentation.value && !work.Instrumentations?.toLowerCase().includes(selectedInstrumentation.value.toLowerCase())) return false
    return !query || Object.values(work).join(' ').toLowerCase().includes(query)
  })
})

const sortedWorks = computed(() => [...filteredWorks.value].sort((a, b) => {
  const result = (a[sortKey.value] || '').localeCompare(b[sortKey.value] || '', 'en', { numeric: true })
  return sortAsc.value ? result : -result
}))

const totalPages = computed(() => Math.max(1, Math.ceil(sortedWorks.value.length / pageSize)))
const paginatedWorks = computed(() => sortedWorks.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize))

function sortBy(key: string) {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value
  else {
    sortKey.value = key
    sortAsc.value = true
  }
}

watch([searchQuery, selectedType, selectedKey, selectedInstrumentation], () => { currentPage.value = 1 })
watch(() => props.catalogue, loadWorks)
onMounted(loadWorks)
</script>

<template>
  <div class="catalogue-table">
    <div class="filters">
      <input v-model="searchQuery" class="search-input" type="search" :placeholder="`Search ${works.length} ${catalogue} works`">
      <select v-model="selectedType" class="filter-select">
        <option value="">All work types</option>
        <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.value }} ({{ option.count }})</option>
      </select>
      <select v-model="selectedKey" class="filter-select">
        <option value="">All keys</option>
        <option v-for="option in keyOptions" :key="option.value" :value="option.value">{{ option.value }} ({{ option.count }})</option>
      </select>
      <select v-model="selectedInstrumentation" class="filter-select">
        <option value="">All instrumentations</option>
        <option v-for="option in instrumentationOptions" :key="option.value" :value="option.value">{{ option.value }} ({{ option.count }})</option>
      </select>
    </div>

    <p v-if="loading">Loading {{ catalogue }} works…</p>
    <p v-else-if="error" class="catalogue-error">{{ error }}</p>
    <template v-else>
      <div class="table-wrapper">
        <table>
          <thead><tr><th v-for="header in headers" :key="header" @click="sortBy(header)">{{ header }} <span v-if="sortKey === header">{{ sortAsc ? '↑' : '↓' }}</span></th></tr></thead>
          <tbody>
            <tr v-for="(work, index) in paginatedWorks" :key="`${work[headers[0]]}-${index}`">
              <td v-for="header in headers" :key="header" :title="work[header]">{{ work[header] }}</td>
            </tr>
            <tr v-if="paginatedWorks.length === 0"><td :colspan="headers.length || 1" class="no-results">No matching works</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button :disabled="currentPage === 1" @click="currentPage--">Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">Next</button>
      </div>
    </template>
  </div>
</template>
