<script setup lang="ts">
import {
  computed,
  ref,
  watch,
  onMounted,
  onBeforeUnmount
} from 'vue'

import type {
  FilterGroup,
  FilterSelection
} from '../data/catalogues'

const props = defineProps<{
  groups: FilterGroup[]
  modelValue: FilterSelection
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: FilterSelection): void
}>()

// 默认显示的选项数量
const collapsedSize = 8

// 控制每个筛选组内部是否显示全部选项
const expanded = ref<Record<string, boolean>>({})

// 当前打开的筛选器
const openField = ref<string | null>(null)

// 整个筛选器容器
const filterContainer = ref<HTMLElement | null>(null)

// 当前已选择的筛选条件数量
const activeCount = computed(() =>
    Object.values(props.modelValue).reduce(
        (total, values) => total + values.length,
        0
    )
)

// 判断某个选项是否被选中
function isSelected(field: string, value: string) {
  return (props.modelValue[field] || []).includes(value)
}

// 当前筛选组已选择的数量
function selectedCount(field: string) {
  return (props.modelValue[field] || []).length
}

// 当前筛选组实际显示哪些选项
function visibleOptions(group: FilterGroup) {
  const sorted = [...group.options].sort(
      (a, b) =>
          b.count - a.count ||
          a.value.localeCompare(b.value, 'en', {
            numeric: true
          })
  )

  // 已经展开，显示全部
  if (
      expanded.value[group.field] ||
      sorted.length <= collapsedSize
  ) {
    return sorted
  }

  // 即使选中的项目排名靠后，也必须保留
  const selected = sorted.filter(option =>
      isSelected(group.field, option.value)
  )

  const rest = sorted
      .filter(option =>
          !isSelected(group.field, option.value)
      )
      .slice(
          0,
          Math.max(
              0,
              collapsedSize - selected.length
          )
      )

  return [...selected, ...rest]
}

// 切换某个选项
function toggle(field: string, value: string) {
  const current = props.modelValue[field] || []

  const values = current.includes(value)
      ? current.filter(
          candidate => candidate !== value
      )
      : [...current, value]

  const next: FilterSelection = {
    ...props.modelValue
  }

  if (values.length) {
    next[field] = values
  } else {
    delete next[field]
  }

  emit('update:modelValue', next)
}

// 清除当前筛选组
function clearGroup(field: string) {
  const next: FilterSelection = {
    ...props.modelValue
  }

  delete next[field]

  emit('update:modelValue', next)
}

// 清除所有筛选条件
function clearAll() {
  emit('update:modelValue', {})
  openField.value = null
}

// 打开 / 关闭某个筛选器
function togglePanel(field: string) {
  openField.value =
      openField.value === field
          ? null
          : field
}

// 点击筛选器外部时关闭面板
function handleDocumentClick(event: MouseEvent) {
  if (!filterContainer.value) return

  const target = event.target as Node

  if (
      !filterContainer.value.contains(target)
  ) {
    openField.value = null
  }
}

// 挂载时监听页面点击
onMounted(() => {
  document.addEventListener(
      'click',
      handleDocumentClick
  )
})

// 卸载时移除监听
onBeforeUnmount(() => {
  document.removeEventListener(
      'click',
      handleDocumentClick
  )
})

// 当筛选组发生变化时，重新折叠
watch(
    () =>
        props.groups
            .map(group => group.field)
            .join('|'),
    () => {
      expanded.value = {}
    }
)
</script>

<template>
  <div
      v-if="groups.length"
      ref="filterContainer"
      class="catalogue-filters"
  >
    <!-- 三个筛选器 -->
    <div class="filter-selectors">

      <!-- Type / Key / Instrumentation -->
      <div
          v-for="group in groups"
          :key="group.field"
          class="filter-selector"
      >

        <!-- 筛选器按钮 -->
        <button
            type="button"
            class="filter-selector-button"
            :class="{
            active:
              selectedCount(group.field) > 0
          }"
            :aria-expanded="
            openField === group.field
          "
            @click="togglePanel(group.field)"
        >
          <span class="filter-label">
            {{ group.label }}
          </span>

          <!-- 已选择数量 -->
          <span
              v-if="selectedCount(group.field)"
              class="filter-selected-count"
          >
            {{ selectedCount(group.field) }}
          </span>

          <!-- 箭头 -->
          <span class="filter-arrow">
            {{
              openField === group.field
                  ? '↑'
                  : '↓'
            }}
          </span>
        </button>

        <!-- 当前筛选器的浮动面板 -->
        <div
            v-if="openField === group.field"
            class="filter-panel"
        >
          <!-- 面板标题 -->
          <div class="filter-panel-header">
            <span class="filter-panel-title">
              {{ group.label }}
            </span>

            <!-- 清除当前组 -->
            <button
                v-if="selectedCount(group.field)"
                type="button"
                class="filter-panel-clear"
                @click="clearGroup(group.field)"
            >
              Clear
            </button>
          </div>

          <!-- 筛选选项 -->
          <div class="filter-buttons">

            <button
                v-for="option in visibleOptions(group)"
                :key="option.value"
                type="button"
                class="filter-button"
                :class="{
                active: isSelected(
                  group.field,
                  option.value
                )
              }"
                :aria-pressed="
                isSelected(
                  group.field,
                  option.value
                )
              "
                @click="
                toggle(
                  group.field,
                  option.value
                )
              "
            >
              {{ option.value }}

              <span class="filter-count">
                ({{ option.count }})
              </span>
            </button>

            <!-- Show all -->
            <button
                v-if="
                group.options.length >
                collapsedSize
              "
                type="button"
                class="filter-more"
                @click="
                expanded[group.field] =
                  !expanded[group.field]
              "
            >
              {{
                expanded[group.field]
                    ? 'Show less'
                    : `Show all ${group.options.length}`
              }}
            </button>

          </div>
        </div>
      </div>

    </div>

    <!-- 全部清除 -->
    <div
        v-if="activeCount"
        class="filter-clear-row"
    >
      <button
          type="button"
          class="filter-clear-all"
          @click="clearAll"
      >
        × Clear filters ({{ activeCount }})
      </button>
    </div>

  </div>
</template>

<style scoped>
.catalogue-filters {
  position: relative;
  z-index: 30;
  width: 100%;
  margin-bottom: 12px;
  text-align: left;
}

/* =========================================================
   三个筛选器
   ========================================================= */

.filter-selectors {
  display: grid;
  grid-template-columns:
    repeat(3, minmax(0, 1fr));
  gap: 6px;
  width: 100%;
}

.filter-selector {
  position: relative;
  min-width: 0;
}

/* =========================================================
   筛选器按钮
   ========================================================= */

.filter-selector-button {
  width: 100%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 7px;

  min-height: 36px;
  padding: 6px 10px;

  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;

  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;

  transition:
      background var(--archive-ease),
      border-color var(--archive-ease),
      color var(--archive-ease);
}

.filter-selector-button:hover {
  border-color: var(--vp-c-brand-1);
}

.filter-selector-button.active {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.filter-label {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.filter-selected-count {
  min-width: 18px;
  padding: 1px 5px;

  border-radius: 10px;

  background: var(--vp-c-brand-1);
  color: white;

  font-size: 10px;
  line-height: 1.3;

  text-align: center;
}

.filter-arrow {
  flex-shrink: 0;

  font-size: 10px;
  opacity: 0.7;
}

/* =========================================================
   浮动筛选面板
   ========================================================= */

.filter-panel {
  position: absolute;

  top: calc(100% + 6px);
  left: 0;

  width: min(
      520px,
      calc(100vw - 32px)
  );

  max-height: min(70vh, 600px);

  overflow-y: auto;

  padding: 14px;

  background: var(--vp-c-bg);

  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;

  box-shadow: var(--vp-shadow-3);

  z-index: 100;
}

/* =========================================================
   面板标题
   ========================================================= */

.filter-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin-bottom: 10px;
}

.filter-panel-title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;

  color: var(--vp-c-text-1);
}

.filter-panel-clear {
  padding: 3px 5px;

  border: 0;

  background: transparent;
  color: var(--vp-c-brand-1);

  font-size: 11px;
  line-height: 1.4;

  cursor: pointer;
}

.filter-panel-clear:hover {
  text-decoration: underline;
}

/* =========================================================
   筛选按钮
   ========================================================= */

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  gap: 5px;

  min-width: 0;
  width: 100%;
}

.filter-button {
  padding: 3px 8px;

  border: 1px solid var(--vp-c-divider);
  border-radius: 2px;

  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;

  transition:
      background var(--archive-ease),
      border-color var(--archive-ease),
      color var(--archive-ease),
      transform var(--archive-ease);
}

.filter-button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.filter-button.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: white;
}

.filter-count {
  opacity: 0.75;
}

/* =========================================================
   Show all
   ========================================================= */

.filter-more {
  padding: 5px 4px;

  border: 0;

  background: transparent;
  color: var(--vp-c-brand-1);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;
}

.filter-more:hover {
  text-decoration: underline;
}

/* =========================================================
   Clear filters
   ========================================================= */

.filter-clear-row {
  display: flex;
  justify-content: flex-end;

  margin-top: 4px;
}

.filter-clear-all {
  padding: 2px 4px;

  border: 0;

  background: transparent;
  color: var(--vp-c-text-3);

  font-size: 11px;
  line-height: 1.4;

  cursor: pointer;
}

.filter-clear-all:hover {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

/* =========================================================
   Mobile
   ========================================================= */

@media (max-width: 640px) {
  .filter-selectors {
    gap: 5px;
  }

  .filter-panel {
    position: fixed;

    top: 70px;
    left: 12px;
    right: 12px;

    width: auto;

    max-height:
        calc(100vh - 90px);
  }
}
</style>