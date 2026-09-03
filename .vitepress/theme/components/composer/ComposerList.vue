<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, Search } from '@element-plus/icons-vue'
import { composerLink, composers, nationalityToEmoji } from '../../data/composers'
import ComposerOverview from './ComposerOverview.vue'

const props = defineProps<{
  era?: string
}>()

const searchQuery = ref('')
const selectedEra = ref('All')
const selectedPeriod = ref<'All' | 'Early' | 'Middle' | 'Late'>('All')
const selectedNationality = ref('All')
const filterOpen = ref(false)
const filterContainer = ref<HTMLElement | null>(null)

const baseComposers = computed(() => {
  if (props.era) return composers.filter(c => c.era === props.era)
  return composers
})

const erasList = computed(() => {
  const values = baseComposers.value.map(c => c.era)
  return ['All', ...Array.from(new Set(values))].sort()
})

const nationalities = computed(() => {
  const values = baseComposers.value.map(c => c.nationality)
  return ['All', ...Array.from(new Set(values))].sort()
})

const filteredComposers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return baseComposers.value.filter(c => {
    if (selectedEra.value !== 'All' && c.era !== selectedEra.value) return false
    if (selectedPeriod.value !== 'All' && c.period !== selectedPeriod.value) return false
    if (selectedNationality.value !== 'All' && c.nationality !== selectedNationality.value) return false
    if (q && !(`${c.name} ${c.nationality} ${c.period} ${c.era}`.toLowerCase().includes(q))) return false
    return true
  })
})

const totalCount = computed(() => filteredComposers.value.length)

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedEra.value !== 'All') count++
  if (selectedPeriod.value !== 'All') count++
  if (selectedNationality.value !== 'All') count++
  return count
})

function selectEra(era: string) {
  selectedEra.value = era
}

function selectPeriod(period: 'All' | 'Early' | 'Middle' | 'Late') {
  selectedPeriod.value = period
}

function selectNationality(nationality: string) {
  selectedNationality.value = nationality
}

function clearAll() {
  selectedEra.value = 'All'
  selectedPeriod.value = 'All'
  selectedNationality.value = 'All'
}

function toggleFilter() {
  filterOpen.value = !filterOpen.value
}

function onSearch() { /* no-op */ }

/** Close filter when clicking outside the filter container */
function handleClickOutside(event: MouseEvent) {
  if (!filterOpen.value) return
  if (!filterContainer.value) return
  const target = event.target as Node
  if (!filterContainer.value.contains(target)) {
    filterOpen.value = false
  }
}

/** Close filter on Escape key */
function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && filterOpen.value) {
    filterOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleClickOutside)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="composer-directory">
    <!-- Era Timeline Overview -->
    <ComposerOverview />

    <!-- Single shared toolbar -->
    <div class="dir-toolbar">
      <el-input
          v-model="searchQuery"
          placeholder="Search composers..."
          clearable
          size="small"
          class="dir-search"
          @input="onSearch"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>

      <!-- Filter entry button -->
      <div ref="filterContainer" class="composer-filters">
        <button
            class="filters-entry"
            :class="{ active: filterOpen }"
            @click="toggleFilter"
        >
          <el-icon class="filters-entry-icon"><Search /></el-icon>
          Filter
          <span v-if="activeFilterCount" class="filters-entry-count">{{ activeFilterCount }}</span>
        </button>

        <!-- Filter megamenu panel -->
        <div v-if="filterOpen" class="filter-megamenu">
          <div class="megamenu-body">
            <!-- Era filter group -->
            <div class="megamenu-group">
              <span class="megamenu-group-label">Era</span>
              <div class="filter-buttons">
                <button
                    v-for="e in erasList"
                    :key="e"
                    class="filter-button"
                    :class="{ active: selectedEra === e }"
                    @click="selectEra(e)"
                >{{ e }}</button>
              </div>
            </div>
            <!-- Period filter group -->
            <div class="megamenu-group">
              <span class="megamenu-group-label">Period</span>
              <div class="filter-buttons">
                <button
                    v-for="p in (['All', 'Early', 'Middle', 'Late'] as const)"
                    :key="p"
                    clas s="filter-button"
                    :class="{ active: selectedPeriod === p }"
                    @click="selectPeriod(p)"
                >{{ p }}</button>
              </div>
            </div>
            <!-- Nationality filter group -->
            <div class="megamenu-group">
              <span class="megamenu-group-label">Nationality</span>
              <div class="filter-buttons">
                <button
                    v-for="n in nationalities"
                    :key="n"
                    class="filter-button"
                    :class="{ active: selectedNationality === n }"
                    @click="selectNationality(n)"
                >{{ n }}</button>
              </div>
            </div>
            <!-- Clear all -->
            <button
                v-if="activeFilterCount"
                class="filter-clear-all"
                @click="clearAll"
            >Clear all</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Result count -->
    <div class="dir-result">
      {{ totalCount }} {{ totalCount === 1 ? 'composer' : 'composers' }}
    </div>

    <!-- Unified Composer Card Grid -->
    <div v-if="totalCount" class="dir-grid">
      <a
          v-for="composer in filteredComposers"
          :key="composer.slug"
          :href="composerLink(composer)"
          class="dir-card"
          :style="{ '--cc': composer.color }"
      >
        <span class="dir-accent" aria-hidden="true"></span>
        <div class="dir-body">
          <div class="dir-name">{{ composer.name }}</div>
          <div class="dir-meta">
            <span
                class="dir-flag"
                :title="composer.nationality || 'Unknown'"
            >{{ nationalityToEmoji(composer.nationality) }}</span>
            <span>{{ composer.born }}–{{ composer.died }}</span>
          </div>
        </div>
        <el-icon class="dir-arrow"><ArrowRight /></el-icon>
      </a>
    </div>

    <!-- Empty state -->
    <div v-else class="dir-empty">No composers match your filters.</div>
  </div>
</template>

<style scoped>
.composer-directory {
  width: 100%;
}

.dir-toolbar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: .8rem;
}

.dir-search {
  flex: 1;
  min-width: 0;
}

:global(.dir-search .el-input__wrapper) {
  height: 40px;
}

/* ---- Filter entry button ---- */
.composer-filters {
  position: relative;
  display: inline-block;
}

.filters-entry {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  background: var(--md-surface);
  color: var(--md-on-surface-variant);
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  transition: border-color var(--md-duration-fast) var(--md-ease),
              color var(--md-duration-fast) var(--md-ease),
              background var(--md-duration-fast) var(--md-ease);
}

.filters-entry:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
}

.filters-entry.active {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 6%, var(--md-surface));
}

.filters-entry-icon {
  font-size: 14px;
}

.filters-entry-count {
  min-width: 16px;
  padding: 0 5px;
  border-radius: var(--md-radius-full);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
}

/* ---- Filter megamenu panel ---- */
.filter-megamenu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 30;
  width: 480px;
  max-width: calc(100vw - 48px);
  padding: 16px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-md);
  background: var(--md-surface);
  box-shadow: var(--md-shadow-3);
}

.megamenu-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.megamenu-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.megamenu-group-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  letter-spacing: .01em;
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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
  transition: background var(--md-duration-fast) var(--md-ease),
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

.filter-clear-all {
  align-self: flex-start;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--md-primary);
  font-size: 12px;
  cursor: pointer;
}

.filter-clear-all:hover {
  text-decoration: underline;
}

/* ---- Result count ---- */
.dir-result {
  font-size: 13px;
  color: var(--md-on-surface-variant);
  margin-bottom: .6rem;
}

/* ---- Card grid: 3 columns on desktop ---- */
.dir-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: .5rem;
}

.dir-card {
  display: flex;
  align-items: stretch;
  gap: .6rem;
  padding: .55rem .7rem;
  text-decoration: none;
  color: inherit;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-md);
  background: var(--md-surface-container-lowest);
  cursor: pointer;
  transition: background var(--md-duration-fast) var(--md-ease),
              border-color var(--md-duration-fast) var(--md-ease),
              box-shadow var(--md-duration-fast) var(--md-ease);
}
.dir-card:hover {
  background: var(--md-surface-container-low);
  border-color: color-mix(in srgb, var(--cc, var(--md-primary)) 40%, var(--md-outline-variant));
  box-shadow: var(--md-shadow-1);
}
.dir-card:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.dir-accent {
  flex: 0 0 4px;
  width: 4px;
  border-radius: var(--md-radius-full);
  background: var(--cc, var(--md-primary));
  align-self: center;
}

.dir-body {
  flex: 1;
  min-width: 0;
}
.dir-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
  line-height: 1.3;
}
.dir-meta {
  display: flex;
  align-items: center;
  gap: .4rem;
  font-size: 12px;
  color: var(--md-on-surface-variant);
  margin-top: .15rem;
}
.dir-flag {
  font-size: 14px;
  line-height: 1;
  cursor: help;
}

.dir-arrow {
  flex: 0 0 auto;
  align-self: center;
  color: var(--md-outline);
  font-size: 14px;
  transition: color var(--md-duration-fast) var(--md-ease);
}
.dir-card:hover .dir-arrow {
  color: var(--md-primary);
}

.dir-empty {
  padding: 2rem;
  text-align: center;
  color: var(--md-on-surface-variant);
  font-size: 14px;
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
  .dir-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .dir-toolbar {
    flex-wrap: wrap;
  }

  .dir-search {
    flex: 1 1 100%;
  }

  .filter-megamenu {
    position: fixed;
    top: 70px;
    left: 12px;
    right: 12px;
    width: auto;
    max-height: calc(100vh - 90px);
    overflow-y: auto;
  }
  .dir-grid { grid-template-columns: 1fr; }
}
</style>