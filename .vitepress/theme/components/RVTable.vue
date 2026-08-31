<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface RVWork {
  RV: string
  Name: string
  Type: string
  Key: string
  Instrumentations: string
}
interface Instrumentation {
  Name: string
  Category: string
  Aliases: string
}
const works = ref<RVWork[]>([])
const currentPage = ref(1)
const pageSize = 10

const sortKey = ref<keyof RVWork>('RV')
const sortAsc = ref(true)
const instrumentations = ref<Instrumentation[]>([])
// =========================
// 筛选
// =========================

const searchQuery = ref('')
const selectedType = ref('')
const selectedKey = ref('')
const selectedInstrumentation = ref('')
// =========================
// CSV 解析
// =========================

function parseCSV(text: string): RVWork[] {
  const lines = text.trim().split(/\r?\n/)

  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"') {
        if (insideQuotes && next === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())

    return {
      RV: values[0] || '',
      Name: values[1] || '',
      Type: values[2] || '',
      Key: values[3] || '',
      Instrumentations: values[4] || ''
    }
  })
}

// =========================
// 加载 CSV
// =========================

onMounted(async () => {
  const [worksResponse, instrumentsResponse] =
      await Promise.all([
        fetch('/data/rv.csv'),
        fetch('/data/instrumentations.csv')
      ])

  const worksText = await worksResponse.text()
  const instrumentsText = await instrumentsResponse.text()

  works.value = parseCSV(worksText)
  instrumentations.value = parseInstrumentationCSV(instrumentsText)
})

// =========================
// Type 筛选选项
// =========================

const typeOptions = computed(() => {
  return [
    ...new Set(
        works.value
            .map(work => work.Type)
            .filter(Boolean)
    )
  ].sort((a, b) => a.localeCompare(b, 'fr'))
})

// =========================
// Key 筛选选项 + 数量
// =========================

const keyOptions = computed(() => {
  const counts = new Map<string, number>()

  works.value.forEach(work => {
    if (work.Key) {
      counts.set(
          work.Key,
          (counts.get(work.Key) || 0) + 1
      )
    }
  })

  return [...counts.entries()]
      .sort(([a], [b]) =>
          a.localeCompare(b, 'fr')
      )
      .map(([key, count]) => ({
        key,
        count
      }))
})

// =========================
// 筛选结果
// =========================

const filteredWorks = computed(() => {
  const query = searchQuery.value
      .trim()
      .toLowerCase()

  return works.value.filter(work => {

    // =========================
    // Type
    // =========================

    if (
        selectedType.value &&
        work.Type !== selectedType.value
    ) {
      return false
    }

    // =========================
    // Key
    // =========================

    if (
        selectedKey.value &&
        work.Key !== selectedKey.value
    ) {
      return false
    }

    // =========================
    // Instrumentation
    // =========================

    if (selectedInstrumentation.value) {

      const instrument = instrumentations.value.find(
          item =>
              item.Name === selectedInstrumentation.value
      )

      if (!instrument) {
        return false
      }

      const aliases = [
        instrument.Name,
        ...instrument.Aliases
            .split(';')
      ]
          .map(value =>
              value.trim().toLowerCase()
          )
          .filter(Boolean)

      const instrumentationText =
          work.Instrumentations
              .toLowerCase()

      const matched = aliases.some(alias => {

        const escapedAlias = alias.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        )

        const regex = new RegExp(
            `(^|[^a-z])${escapedAlias}(?:s)?(?=$|[^a-z])`,
            'i'
        )

        return regex.test(
            instrumentationText
        )
      })

      if (!matched) {
        return false
      }
    }

    // =========================
    // Search
    // =========================

    if (query) {

      const text = [
        work.RV,
        work.Name,
        work.Type,
        work.Key,
        work.Instrumentations
      ]
          .join(' ')
          .toLowerCase()

      if (!text.includes(query)) {
        return false
      }
    }

    return true
  })
})

const instrumentationOptions = computed(() => {
  return [...instrumentations.value]
      .sort((a, b) =>
          a.Name.localeCompare(
              b.Name,
              'en'
          )
      )
})
// =========================
// 排序
// =========================

function sortBy(key: keyof RVWork) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

const sortedWorks = computed(() => {
  return [...filteredWorks.value].sort((a, b) => {

    // RV 专用排序
    if (sortKey.value === 'RV') {
      const aRV = a.RV.trim()
      const bRV = b.RV.trim()

      const aAnh = /^Anh\.?\s*/i.test(aRV)
      const bAnh = /^Anh\.?\s*/i.test(bRV)

      // Anh 排在普通 RV 后面
      if (aAnh !== bAnh) {
        return sortAsc.value
            ? (aAnh ? 1 : -1)
            : (aAnh ? -1 : 1)
      }

      const aNum = parseInt(
          aRV.replace(/^Anh\.?\s*/i, ''),
          10
      )

      const bNum = parseInt(
          bRV.replace(/^Anh\.?\s*/i, ''),
          10
      )

      // 两个都是数字
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortAsc.value
            ? aNum - bNum
            : bNum - aNum
      }

      // 其他 RV
      return sortAsc.value
          ? aRV.localeCompare(
              bRV,
              'fr',
              { numeric: true }
          )
          : bRV.localeCompare(
              aRV,
              'fr',
              { numeric: true }
          )
    }

    // 其他列
    const x = a[sortKey.value]
    const y = b[sortKey.value]

    function normalizeForSort(value: string) {
      return value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
    }

    function normalizeNameForSort(value: string) {
      let result = normalizeForSort(value)

      // 去掉意大利语冠词
      result = result.replace(
          /^(l['’]\s*|il\s+|lo\s+|la\s+|i\s+|gli\s+|le\s+)/i,
          ''
      )

      return result.trim()
    }

    const nx = sortKey.value === 'Name'
        ? normalizeNameForSort(x)
        : normalizeForSort(x)

    const ny = sortKey.value === 'Name'
        ? normalizeNameForSort(y)
        : normalizeForSort(y)

    return sortAsc.value
        ? nx.localeCompare(ny, 'en')
        : ny.localeCompare(nx, 'en')
  })
})
// =========================
// 分页
// =========================

const totalPages = computed(() => {
  return Math.max(
      1,
      Math.ceil(
          sortedWorks.value.length / pageSize
      )
  )
})

const paginatedWorks = computed(() => {
  const start =
      (currentPage.value - 1) * pageSize

  return sortedWorks.value.slice(
      start,
      start + pageSize
  )
})

function changePage(page: number) {
  if (
      page < 1 ||
      page > totalPages.value
  ) {
    return
  }

  currentPage.value = page
}
function parseInstrumentationCSV(
    text: string
): Instrumentation[] {
  const lines = text.trim().split(/\r?\n/)

  return lines.slice(1).map(line => {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"') {
        if (insideQuotes && next === '"') {
          current += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    values.push(current.trim())

    return {
      Name: values[0] || '',
      Category: values[1] || '',
      Aliases: values[2] || ''
    }
  })
}
// =========================
// 筛选变化后回到第一页
// =========================

watch(
    [
      searchQuery,
      selectedType,
      selectedKey,
      selectedInstrumentation
    ],
    () => {
      currentPage.value = 1
    }
)
</script>

<template>
  <div class="rv-table">

    <!-- 筛选区域 -->
    <div class="filters">

      <!-- Search -->
      <input
          v-model="searchQuery"
          type="text"
          :placeholder="`Search ${works.length} works by RV number, names, etc.`"
          class="search-input"
      />

    </div>

    <div class="filters">

      <!-- Type -->
      <select
          v-model="selectedType"
          class="filter-select"
      >
        <option value="">
          Work Types
        </option>

        <option
            v-for="type in typeOptions"
            :key="type"
            :value="type"
        >
          {{ type }}
        </option>
      </select>

      <!-- Key -->
      <select
          v-model="selectedKey"
          class="filter-select key-select"
      >
        <option value="">
          Key
        </option>

        <option
            v-for="item in keyOptions"
            :key="item.key"
            :value="item.key"
        >
          {{ item.key }} ({{ item.count }})
        </option>
      </select>

      <select
          v-model="selectedInstrumentation"
          class="filter-select"
      >
        <option value="">
          Instrumentation
        </option>

        <option
            v-for="item in instrumentationOptions"
            :key="item.Name"
            :value="item.Name"
        >
          {{ item.Name }}
        </option>
      </select>

    </div>
    <!-- 表格 -->
    <div class="table-wrapper">
      <table>

        <thead>
        <tr>

          <th @click="sortBy('RV')">
            RV
            <span v-if="sortKey === 'RV'">
                {{ sortAsc ? '↑' : '↓' }}
              </span>
          </th>

          <th @click="sortBy('Name')">
            Name
            <span v-if="sortKey === 'Name'">
                {{ sortAsc ? '↑' : '↓' }}
              </span>
          </th>

          <th @click="sortBy('Type')">
            Type
            <span v-if="sortKey === 'Type'">
                {{ sortAsc ? '↑' : '↓' }}
              </span>
          </th>

          <th @click="sortBy('Key')">
            Key
            <span v-if="sortKey === 'Key'">
                {{ sortAsc ? '↑' : '↓' }}
              </span>
          </th>

          <th @click="sortBy('Instrumentations')">
            Instrumentations
            <span
                v-if="sortKey === 'Instrumentations'"
            >
                {{ sortAsc ? '↑' : '↓' }}
              </span>
          </th>

        </tr>
        </thead>

        <tbody>

        <tr
            v-for="work in paginatedWorks"
            :key="work.RV"
        >

          <td>
            {{ work.RV }}
          </td>

          <td
              class="truncate"
              :title="work.Name"
          >
            {{ work.Name }}
          </td>

          <td>
            {{ work.Type }}
          </td>

          <td>
            {{ work.Key }}
          </td>

          <td
              class="truncate"
              :title="work.Instrumentations"
          >
            <span>{{ work.Instrumentations }}</span>
          </td>

        </tr>

        <!-- 没有结果 -->
        <tr
            v-if="paginatedWorks.length === 0"
        >
          <td
              colspan="5"
              class="no-results"
          >
            No results
          </td>
        </tr>

        </tbody>

      </table>
    </div>

    <!-- 分页 -->
    <div class="pagination">

      <button
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
      >
        Previous
      </button>

      <span>
        {{ currentPage }} / {{ totalPages }}
      </span>

      <button
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
      >
        Next
      </button>

    </div>

  </div>
</template>