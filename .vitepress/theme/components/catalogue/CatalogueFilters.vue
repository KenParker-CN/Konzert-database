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
} from '../../data/catalogues'

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

// Megamenu 面板整体开合
const open = ref(false)

// 当前激活的分类（Type / Key / Instrumentation）
const activeSection = ref('')

// 整个筛选器容器
const filterContainer = ref<HTMLElement | null>(null)

// 当前已选择的筛选条件数量
const activeCount = computed(() =>
    Object.values(props.modelValue).reduce(
        (total, values) => total + values.length,
        0
    )
)

// 当前激活的筛选组
const activeGroup = computed(() =>
    props.groups.find(group => group.field === activeSection.value)
        ?? props.groups[0]
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
  expanded.value = {}
}

// 打开 / 关闭面板；已打开时点击分类即切换激活分类
function togglePanel(field: string) {
  if (open.value && activeSection.value === field) {
    open.value = false
    return
  }

  activeSection.value = field
  open.value = true
}

// 点击面板外部时关闭
function handleDocumentClick(event: MouseEvent) {
  if (!filterContainer.value) return

  const target = event.target as Node

  if (
      !filterContainer.value.contains(target)
  ) {
    open.value = false
  }
}

// Esc 关闭面板
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

// 挂载时监听页面点击与键盘
onMounted(() => {
  document.addEventListener(
      'click',
      handleDocumentClick
  )
  document.addEventListener(
      'keydown',
      handleKeydown
  )
})

// 卸载时移除监听
onBeforeUnmount(() => {
  document.removeEventListener(
      'click',
      handleDocumentClick
  )
  document.removeEventListener(
      'keydown',
      handleKeydown
  )
})

// 当筛选组发生变化时，重新折叠并校正激活分类
watch(
    () =>
        props.groups
            .map(group => group.field)
            .join('|'),
    () => {
      expanded.value = {}

      if (
          props.groups.length &&
          !props.groups.some(
              group => group.field === activeSection.value
          )
      ) {
        activeSection.value = props.groups[0].field
      }
    }
)
</script>

<template>
  <div
      ref="filterContainer"
      class="catalogue-filters"
  >
    <!-- Megamenu 入口 -->
    <button
        type="button"
        class="filters-entry"
        :class="{ active: open || activeCount > 0 }"
        aria-haspopup="dialog"
        :aria-expanded="open"
        @click="togglePanel(activeGroup?.field || 'type')"
    >
      <span
          aria-hidden="true"
          class="entry-icon"
      >
        ≡
      </span>

      <span>Filters</span>

      <span
          v-if="activeCount"
          class="entry-count"
      >
        {{ activeCount }}
      </span>

      <span
          aria-hidden="true"
          class="entry-arrow"
      >
        {{ open ? '↑' : '↓' }}
      </span>
    </button>

    <!-- 宽型 Megamenu 面板 -->
    <div
        v-if="open && activeGroup"
        class="filter-megamenu"
        role="dialog"
        aria-label="Catalogue filters"
    >
      <!-- 顶部横向分类入口 -->
      <div
          class="megamenu-sections"
          role="tablist"
          aria-label="Filter categories"
      >
        <button
            v-for="group in groups"
            :key="group.field"
            type="button"
            role="tab"
            :aria-selected="activeSection === group.field"
            :class="{ active: activeSection === group.field }"
            class="megamenu-section"
            @click="togglePanel(group.field)"
        >
          <span>{{ group.label }}</span>

          <span
              v-if="selectedCount(group.field)"
              class="section-count"
          >
            {{ selectedCount(group.field) }}
          </span>
        </button>

        <button
            v-if="activeCount"
            type="button"
            class="megamenu-clear-all"
            @click="clearAll"
        >
          × Clear all ({{ activeCount }})
        </button>
      </div>

      <!-- 内容区：激活分类的筛选 chips -->
      <div
          class="megamenu-body"
          role="tabpanel"
      >
        <div class="megamenu-body-header">
          <span class="megamenu-title">
            {{ activeGroup.label }}
          </span>

          <button
              v-if="selectedCount(activeGroup.field)"
              type="button"
              class="megamenu-clear-group"
              @click="clearGroup(activeGroup.field)"
          >
            Clear
          </button>
        </div>

        <div class="filter-buttons">
          <button
              v-for="option in visibleOptions(activeGroup)"
              :key="option.value"
              type="button"
              class="filter-button"
              :class="{
                active: isSelected(
                  activeGroup.field,
                  option.value
                )
              }"
              :aria-pressed="
                isSelected(
                  activeGroup.field,
                  option.value
                )
              "
              @click="
                toggle(
                  activeGroup.field,
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
                activeGroup.options.length >
                collapsedSize
              "
              type="button"
              class="filter-more"
              @click="
                expanded[activeGroup.field] =
                  !expanded[activeGroup.field]
              "
          >
            {{
              expanded[activeGroup.field]
                  ? 'Show less'
                  : `Show all ${activeGroup.options.length}`
            }}
          </button>
        </div>
      </div>
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
   入口按钮
   ========================================================= */

.filters-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  min-height: 36px;
  padding: 6px 14px;

  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);

  background: var(--md-surface);
  color: var(--md-on-surface-variant);

  font-size: 13px;
  line-height: 1.4;

  cursor: pointer;

  transition:
      background var(--md-duration-fast) var(--md-ease),
      border-color var(--md-duration-fast) var(--md-ease),
      color var(--md-duration-fast) var(--md-ease),
      box-shadow var(--md-duration-fast) var(--md-ease);
}

.filters-entry:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

.filters-entry.active {
  border-color: var(--md-primary);
  color: var(--md-primary);
}

.filters-entry:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

.entry-icon {
  font-size: 14px;
}

.entry-count {
  min-width: 18px;
  padding: 1px 5px;

  border-radius: var(--md-radius-full);

  background: var(--md-primary);
  color: var(--md-on-primary);

  font-size: 11px;
  line-height: 1.3;
  text-align: center;
}

.entry-arrow {
  font-size: 10px;
  opacity: .7;
}

/* =========================================================
   宽型 Megamenu 面板
   ========================================================= */

.filter-megamenu {
  position: absolute;

  top: calc(100% + 8px);
  left: 0;

  width: min(860px, 100%);

  padding: 6px 16px 16px;

  background: var(--md-surface);

  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-lg);

  box-shadow: var(--md-shadow-3);

  z-index: 100;
}

/* ---- 顶部横向分类入口 ---- */

.megamenu-sections {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  gap: 4px;

  border-bottom: 1px solid var(--md-outline-variant);
}

.megamenu-section {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 10px 14px;

  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;

  background: transparent;
  color: var(--md-on-surface-variant);

  font-size: 13px;
  font-weight: 500;
  letter-spacing: .01em;

  cursor: pointer;

  transition:
      color var(--md-duration-fast) var(--md-ease),
      border-color var(--md-duration-fast) var(--md-ease);
}

.megamenu-section:hover {
  color: var(--md-primary);
}

.megamenu-section.active {
  color: var(--md-primary);
  border-bottom-color: var(--md-primary);
}

.section-count {
  min-width: 16px;
  padding: 0 5px;

  border-radius: var(--md-radius-full);

  background: var(--md-primary-container);
  color: var(--md-on-primary-container);

  font-size: 10px;
  line-height: 1.5;
  text-align: center;
}

.megamenu-clear-all {
  margin-left: auto;
  padding: 6px 10px;

  border: 0;

  background: transparent;
  color: var(--md-outline);

  font-size: 12px;

  cursor: pointer;
}

.megamenu-clear-all:hover {
  color: var(--md-error);
  text-decoration: underline;
}

/* ---- 内容区 ---- */

.megamenu-body {
  padding-top: 14px;
}

.megamenu-body-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  margin-bottom: 12px;
}

.megamenu-title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .01em;

  color: var(--md-on-surface);
}

.megamenu-clear-group {
  padding: 3px 6px;

  border: 0;

  background: transparent;
  color: var(--md-primary);

  font-size: 12px;

  cursor: pointer;
}

.megamenu-clear-group:hover {
  text-decoration: underline;
}

/* ---- 筛选 chips ---- */

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  gap: 8px;

  min-width: 0;
  width: 100%;
}

.filter-button {
  padding: 5px 12px;

  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);

  background: var(--md-surface-container-low);
  color: var(--md-on-surface-variant);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;

  transition:
      background var(--md-duration-fast) var(--md-ease),
      border-color var(--md-duration-fast) var(--md-ease),
      color var(--md-duration-fast) var(--md-ease);
}

.filter-button:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

.filter-button.active {
  background: var(--md-primary);
  border-color: var(--md-primary);
  color: var(--md-on-primary);
}

.filter-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

.filter-count {
  opacity: .7;
}

.filter-more {
  padding: 5px 8px;

  border: 0;

  background: transparent;
  color: var(--md-primary);

  font-size: 12px;

  cursor: pointer;
}

.filter-more:hover {
  text-decoration: underline;
}

/* =========================================================
   Mobile：fixed 全宽
   ========================================================= */

@media (max-width: 640px) {
  .filter-megamenu {
    position: fixed;

    top: 70px;
    left: 12px;
    right: 12px;

    width: auto;

    max-height:
        calc(100vh - 90px);

    overflow-y: auto;
  }
}
</style>
