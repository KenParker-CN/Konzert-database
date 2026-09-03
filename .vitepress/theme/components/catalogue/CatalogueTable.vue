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

const expandedRows = ref<Set<number>>(new Set())
const popoverWidth = typeof window !== 'undefined' ? Math.min(480, window.innerWidth - 120) : 360

function toggleExpand(index: number) {
  const next = new Set(expandedRows.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  expandedRows.value = next
}

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

const columnHeaders = computed(() =>
    headers.value.filter(
        header => header.toLowerCase() !== 'instrumentation' && header.toLowerCase() !== 'note'
    )
)

/*
 * el-table 的 custom 排序事件驱动排序状态。
 * order 为 null（第三次点击取消排序）时保持现状。
 */
function onSortChange(event: { prop: string; order: 'ascending' | 'descending' | null }) {
  if (!event.prop || !event.order) return
  sortKey.value = event.prop
  sortAsc.value = event.order === 'ascending'
}

/*
 * 第一列、Type、Key 居中完整显示；
 * 其余列省略号 + hover tooltip。
 */
function isFullContentColumn(header: string, index: number) {
  if (index === 0) return true

  return header.trim().toLowerCase() === 'type' ||
      header.trim().toLowerCase() === 'key'
}

/* 列宽启发：编号列紧凑固定，former KV 固定宽度，Type/Key 固定居中，其余弹性。 */
function columnWidth(header: string, index: number): number | undefined {
  if (index === 0) return 110

  const key = header.trim().toLowerCase()
  if (key === 'former kv') return 90
  if (key === 'type') return 150
  if (key === 'key') return 120
  return undefined
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
      <el-input
          v-model="searchQuery"
          class="search-input"
          clearable
          :placeholder="`Search ${works.length} ${catalogue} works`"
          aria-label="Search catalogue works"
      >
        <template #prefix>
          <span aria-hidden="true">⌕</span>
        </template>
      </el-input>
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

      <!-- Table (Element Plus, themed via M3 token mapping) -->
      <el-table
          v-loading="loading"
          :data="paginatedWorks"
          border
          class="catalogue-eltable"
          empty-text="No matching works"
          @sort-change="onSortChange"
      >
        <!-- Toggle + first column merged -->
        <el-table-column
            :label="columnHeaders[0]"
            :width="columnWidth(columnHeaders[0], 0)"
            :min-width="columnWidth(columnHeaders[0], 0) ? undefined : 150"
            align="center"
            :fixed="true"
        >
          <template #default="{ row, $index }">
            <div class="first-column-cell">
              <el-popover
                  placement="bottom"
                  :width="popoverWidth"
                  trigger="click"
                  teleported
                  @show="toggleExpand($index)"
                  @hide="toggleExpand($index)"
              >
                <template #reference>
                  <button
                    type="button"
                    class="expand-toggle"
                    :class="{ 'expand-toggle--active': expandedRows.has($index) }"
                    :aria-expanded="expandedRows.has($index) ? 'true' : 'false'"
                    aria-label="Expand row"
                  >
                    <svg viewBox="0 0 1024 1024" width="16" height="16" fill="currentColor">
                      <path d="M340.864 149.312a30.59 30.59 0 0 0 0 42.752L652.736 512 340.864 831.872a30.59 30.59 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"/>
                    </svg>
                  </button>
                </template>
                <dl class="expand-detail">
                  <template
                      v-for="header in headers"
                      :key="header"
                  >
                    <dt>{{ header }}</dt>
                    <dd>{{ row[header] || '—' }}</dd>
                  </template>
                </dl>
              </el-popover>
              <span class="first-column-text">{{ row[columnHeaders[0]] }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
            v-for="(header, index) in columnHeaders.slice(1)"
            :key="header"
            :prop="header"
            :label="header"
            sortable="custom"
            :width="columnWidth(header, index + 1)"
            :min-width="columnWidth(header, index + 1) ? undefined : 150"
            :align="isFullContentColumn(header, index + 1) ? 'center' : 'left'"
            :show-overflow-tooltip="!isFullContentColumn(header, index + 1)"
        />
      </el-table>

      <!-- Pagination -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredWorks.length"
            layout="prev, pager, next"
            background
            :hide-on-single-page="false"
        />
      </div>

    </template>

  </div>
</template>

<style scoped>
.filters {
  position: relative;
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  max-width: 480px;
}

.result-count {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--md-outline);
  letter-spacing: .01em;
}

/* ---------- Element Plus table → M3 ---------- */

.catalogue-eltable {
  --el-table-border-color: var(--md-outline-variant);
  --el-table-header-bg-color: var(--md-surface-container-low);
  --el-table-header-text-color: var(--md-on-surface-variant);
  --el-table-text-color: var(--md-on-surface);
  --el-table-row-hover-bg-color: var(--md-surface-container-low);
  --el-table-bg-color: var(--md-surface);
  --el-table-tr-bg-color: var(--md-surface);
  --el-table-expanded-cell-bg-color: var(--md-surface-container-low);
  width: 100%;
  border-radius: var(--md-radius-md);
  overflow: hidden;
}

.catalogue-eltable :deep(.el-scrollbar__view) {
  display: block !important;
  vertical-align: top !important;
}

.catalogue-eltable :deep(.el-table__header th) {
  font-weight: 600;
  letter-spacing: .01em;
}

/* Expand toggle button */
.expand-toggle {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--md-outline-variant, var(--vp-c-divider));
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant, var(--vp-c-text-2));
  cursor: pointer;
  transition: transform 160ms var(--md-ease, ease),
              background 120ms var(--md-ease, ease),
              border-color 120ms var(--md-ease, ease),
              color 120ms var(--md-ease, ease);
}

.expand-toggle:hover {
  border-color: var(--md-primary, var(--vp-c-brand-1));
  color: var(--md-primary, var(--vp-c-brand-1));
}

.expand-toggle--active {
  transform: rotate(90deg);
  color: var(--md-primary, var(--vp-c-brand-1));
  border-color: var(--md-primary, var(--vp-c-brand-1));
}

.expand-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary, var(--vp-c-brand-1)) 40%, transparent);
}

/* First column cell with toggle + text */
.first-column-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.first-column-text {
  font-weight: 500;
}

/* Expand content: full field list */
.expand-detail {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 6px 18px;
  margin: 0;
  padding: 4px 8px;
}

.expand-detail dt {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
}

.expand-detail dd {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: var(--md-on-surface);
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .expand-detail {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }

  .expand-detail dd {
    margin-bottom: 8px;
  }
}

/* ---------- Pagination ---------- */

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
