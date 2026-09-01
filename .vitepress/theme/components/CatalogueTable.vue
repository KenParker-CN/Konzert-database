<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import CatalogueFilters from './CatalogueFilters.vue'
import {
  applyFilters,
  buildFilterGroups,
  detectFilterFields,
  loadCatalogue,
  type FilterSelection,
  type Work
} from '../data/catalogues'

const props = defineProps<{ catalogue: string }>()

const works = ref<Work[]>([])
const headers = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const selection = ref<FilterSelection>({})
const sortKey = ref('')
const sortAsc = ref(true)
const currentPage = ref(1)
const pageSize = 10

async function loadWorks() {
  loading.value = true
  error.value = ''
  searchQuery.value = ''
  selection.value = {}
  currentPage.value = 1

  try {
    const data = await loadCatalogue(props.catalogue)
    headers.value = data.headers
    works.value = data.works
    sortKey.value = data.headers[0] || ''
  } catch (cause) {
    works.value = []
    headers.value = []
    error.value = `Unable to load the ${props.catalogue} catalogue.`
    console.error(cause)
  } finally {
    loading.value = false
  }
}

const filterFields = computed(() => detectFilterFields(headers.value, works.value))
const filterGroups = computed(() => buildFilterGroups(works.value, filterFields.value, selection.value, searchQuery.value))
const filteredWorks = computed(() => applyFilters(works.value, filterFields.value, selection.value, searchQuery.value))

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

watch([searchQuery, selection], () => { currentPage.value = 1 }, { deep: true })
watch(totalPages, pages => { if (currentPage.value > pages) currentPage.value = pages })
watch(() => props.catalogue, loadWorks)
onMounted(loadWorks)
</script>

<template>
  <div class="catalogue-table">
    <div class="filters">
      <span aria-hidden="true">⌕</span><input v-model="searchQuery" class="search-input" type="search" :placeholder="`Search ${works.length} ${catalogue} works`" aria-label="Search catalogue works">
    </div>

    <CatalogueFilters v-model="selection" :groups="filterGroups" />

    <p v-if="loading">Loading {{ catalogue }} works…</p>
    <p v-else-if="error" class="catalogue-error">{{ error }}</p>
    <template v-else>
      <p class="result-count">{{ filteredWorks.length }} of {{ works.length }} works</p>
      <div class="table-wrapper">
        <table>
          <thead><tr><th v-for="header in headers" :key="header" :aria-sort="sortKey === header ? (sortAsc ? 'ascending' : 'descending') : 'none'" @click="sortBy(header)">{{ header }} <span v-if="sortKey === header" aria-hidden="true">{{ sortAsc ? '↑' : '↓' }}</span></th></tr></thead>
          <tbody>
            <tr v-for="(work, index) in paginatedWorks" :key="`${work[headers[0]]}-${index}`">
              <td v-for="header in headers" :key="header" :title="work[header]">{{ work[header] }}</td>
            </tr>
            <tr v-if="paginatedWorks.length === 0"><td :colspan="headers.length || 1" class="no-results">No matching works</td></tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button :disabled="currentPage === 1" @click="currentPage--">← Previous</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++">Next →</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.filters { position: relative; }
.filters > span { position: absolute; left: .75rem; z-index: 1; color: var(--vp-c-text-3); }
.search-input { padding-left: 2rem; }
.result-count { margin: 0 0 12px; font-size: 12px; color: var(--vp-c-text-3); letter-spacing: .05em; text-transform: uppercase; }
</style>
