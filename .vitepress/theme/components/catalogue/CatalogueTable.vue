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
} from '../../data/catalogues'

const props = defineProps<{
  catalogue: string
}>()

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
    sortAsc.value = true
  } catch (cause) {
    works.value = []
    headers.value = []
    error.value = `Unable to load the ${props.catalogue} catalogue.`
    console.error(cause)
  } finally {
    loading.value = false
  }
}

const filterFields = computed(() =>
    detectFilterFields(headers.value, works.value)
)

const filterGroups = computed(() =>
    buildFilterGroups(
        works.value,
        filterFields.value,
        selection.value,
        searchQuery.value
    )
)

const filteredWorks = computed(() =>
    applyFilters(
        works.value,
        filterFields.value,
        selection.value,
        searchQuery.value
    )
)

const sortedWorks = computed(() =>
    [...filteredWorks.value].sort((a, b) => {
      const result = (a[sortKey.value] || '').localeCompare(
          b[sortKey.value] || '',
          'en',
          { numeric: true }
      )

      return sortAsc.value ? result : -result
    })
)

const totalPages = computed(() =>
    Math.max(1, Math.ceil(sortedWorks.value.length / pageSize))
)

const paginatedWorks = computed(() =>
    sortedWorks.value.slice(
        (currentPage.value - 1) * pageSize,
        currentPage.value * pageSize
    )
)

/*
 * 空行数量。
 *
 * 例如：
 * 10 条 → 0 个空行
 * 7 条  → 3 个空行
 * 2 条  → 8 个空行
 *
 * 保证每一页表格始终保持相同高度。
 */
const emptyRowCount = computed(() =>
    Math.max(0, pageSize - paginatedWorks.value.length)
)

function sortBy(key: string) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

/*
 * 第一列、Type、Key 不省略。
 */
function isFullContentColumn(header: string, index: number) {
  if (index === 0) return true

  return header.trim().toLowerCase() === 'type' ||
      header.trim().toLowerCase() === 'key'
}

watch(
    [searchQuery, selection],
    () => {
      currentPage.value = 1
    },
    { deep: true }
)

watch(totalPages, pages => {
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

watch(
    () => props.catalogue,
    loadWorks
)

onMounted(loadWorks)
</script>

<template>
  <div class="catalogue-table">

    <!-- Search -->
    <div class="filters">
      <span aria-hidden="true">⌕</span>

      <input
          v-model="searchQuery"
          class="search-input"
          type="search"
          :placeholder="`Search ${works.length} ${catalogue} works`"
          aria-label="Search catalogue works"
      >
    </div>

    <!-- Catalogue filters -->
    <CatalogueFilters
        v-model="selection"
        :groups="filterGroups"
    />

    <!-- Loading -->
    <p v-if="loading">
      Loading {{ catalogue }} works…
    </p>

    <!-- Error -->
    <p
        v-else-if="error"
        class="catalogue-error"
    >
      {{ error }}
    </p>

    <template v-else>

      <!-- Result count -->
      <p class="result-count">
        {{ filteredWorks.length }} of {{ works.length }} works
      </p>

      <!-- Table -->
      <div class="table-wrapper">

        <table>

          <thead>
          <tr>
            <th
                v-for="(header, index) in headers"
                :key="header"
                :class="{
                  'full-content-column': isFullContentColumn(header, index)
                }"
                :aria-sort="
                  sortKey === header
                    ? (sortAsc ? 'ascending' : 'descending')
                    : 'none'
                "
                @click="sortBy(header)"
            >
                <span class="header-content">
                  {{ header }}

                  <span
                      v-if="sortKey === header"
                      aria-hidden="true"
                      class="sort-arrow"
                  >
                    {{ sortAsc ? '↑' : '↓' }}
                  </span>
                </span>
            </th>
          </tr>
          </thead>

          <tbody>

          <!-- Actual rows -->
          <template v-if="paginatedWorks.length">

            <tr
                v-for="(work, index) in paginatedWorks"
                :key="`${work[headers[0]]}-${index}`"
            >

              <td
                  v-for="(header, columnIndex) in headers"
                  :key="header"
                  :class="{
                    'full-content-column':
                      isFullContentColumn(header, columnIndex)
                  }"
                  :title="work[header] || ''"
              >
                  <span class="cell-content">
                    {{ work[header] }}
                  </span>
              </td>

            </tr>

            <!-- Empty rows -->
            <tr
                v-for="index in emptyRowCount"
                :key="`empty-${index}`"
                class="empty-row"
                aria-hidden="true"
            >
              <td
                  v-for="header in headers"
                  :key="header"
              >
                &nbsp;
              </td>
            </tr>

          </template>

          <!-- No results -->
          <tr v-else>
            <td
                :colspan="headers.length || 1"
                class="no-results"
            >
              No matching works
            </td>
          </tr>

          </tbody>

        </table>

      </div>

      <!-- Pagination -->
      <div class="pagination">

        <button
            type="button"
            :disabled="currentPage === 1"
            @click="currentPage--"
        >
          ← Previous
        </button>

        <span>
          {{ currentPage }} / {{ totalPages }}
        </span>

        <button
            type="button"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
        >
          Next →
        </button>

      </div>

    </template>

  </div>
</template>

<style scoped>
.filters {
  position: relative;
}

.filters > span {
  position: absolute;
  left: .75rem;
  z-index: 1;
  color: var(--vp-c-text-3);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding-left: 2rem;
}

.result-count {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  letter-spacing: .05em;
  text-transform: uppercase;
}


/* =========================
   Table wrapper
   ========================= */

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}
.table-wrapper table {
  display: table;
}
.table-wrapper table {
  width: 100%;
  min-width: 100%;
  max-width: none;
  margin: 0;
  table-layout: fixed;
  border-collapse: collapse;
}


/* =========================
   Header
   ========================= */

.table-wrapper th {
  height: 42px;
  padding: 8px 10px;
  text-align: center;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.header-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sort-arrow {
  margin-left: 4px;
}


/* =========================
   Body
   ========================= */

.table-wrapper tbody tr {
  height: 44px;
}

.table-wrapper td {
  height: 44px;
  padding: 8px 10px;
  vertical-align: middle;
}


/* =========================
   普通列
   显示省略号
   鼠标悬浮 title 显示完整内容
   ========================= */

.table-wrapper td:not(.full-content-column) {
  overflow: hidden;
}

.cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


/* =========================
   第一列 / Type / Key
   完整显示
   ========================= */

.table-wrapper th.full-content-column,
.table-wrapper td.full-content-column {
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
}

.table-wrapper td.full-content-column .cell-content {
  overflow: visible;
  white-space: nowrap;
  text-overflow: clip;
  text-align: center;
}


/* =========================
   Empty rows
   ========================= */

.table-wrapper tr.empty-row td {
  height: 44px;
  padding: 8px 10px;
}


/* =========================
   No results
   ========================= */

.no-results {
  height: 440px;
  text-align: center;
  vertical-align: middle;
  color: var(--vp-c-text-3);
}


/* =========================
   Pagination
   ========================= */

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 14px;
}

.pagination button {
  cursor: pointer;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: .5;
}

.pagination span {
  min-width: 60px;
  text-align: center;
}
</style>