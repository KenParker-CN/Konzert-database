<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FilterGroup, FilterSelection } from '../data/catalogues'

const props = defineProps<{
  groups: FilterGroup[]
  modelValue: FilterSelection
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: FilterSelection): void
}>()

const collapsedSize = 12
const expanded = ref<Record<string, boolean>>({})

const activeCount = computed(() =>
    Object.values(props.modelValue).reduce((total, values) => total + values.length, 0)
)

function isSelected(field: string, value: string) {
  return (props.modelValue[field] || []).includes(value)
}

function visibleOptions(group: FilterGroup) {
  if (expanded.value[group.field] || group.options.length <= collapsedSize) return group.options
  const selected = group.options.filter(option => isSelected(group.field, option.value))
  const rest = [...group.options]
      .filter(option => !isSelected(group.field, option.value))
      .sort((a, b) => b.count - a.count)
      .slice(0, Math.max(0, collapsedSize - selected.length))
  return group.options.filter(option => selected.includes(option) || rest.includes(option))
}

function toggle(field: string, value: string) {
  const current = props.modelValue[field] || []
  const values = current.includes(value)
      ? current.filter(candidate => candidate !== value)
      : [...current, value]
  const next: FilterSelection = { ...props.modelValue }
  if (values.length) next[field] = values
  else delete next[field]
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', {})
}

watch(() => props.groups.map(group => group.field).join('|'), () => {
  expanded.value = {}
})
</script>

<template>
  <div v-if="groups.length" class="catalogue-filters">
    <div v-for="group in groups" :key="group.field" class="filter-group">
      <div class="filter-label">{{ group.label }}</div>

      <div class="filter-buttons">
        <button
            v-for="option in visibleOptions(group)"
            :key="option.value"
            type="button"
            class="filter-button"
            :class="{ active: isSelected(group.field, option.value) }"
            :aria-pressed="isSelected(group.field, option.value)"
            @click="toggle(group.field, option.value)"
        >
          {{ option.value }} <span class="filter-count">({{ option.count }})</span>
        </button>

        <button
            v-if="group.options.length > collapsedSize"
            type="button"
            class="filter-more"
            @click="expanded[group.field] = !expanded[group.field]"
        >
          {{ expanded[group.field] ? 'Show less' : `Show all ${group.options.length}` }}
        </button>
      </div>
    </div>

    <div v-if="activeCount" class="filter-actions">
      <button type="button" class="filter-clear" @click="clearAll">
        Clear filters ({{ activeCount }})
      </button>
    </div>
  </div>
</template>

<style scoped>
.catalogue-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;

  margin-bottom: 16px;
  padding: 16px;

  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;

  text-align: left;
}

.filter-group {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: start;
  column-gap: 14px;
  width: 100%;
}

.filter-label {
  padding-top: 5px;

  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;

  color: var(--vp-c-text-2);
}

.filter-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;

  min-width: 0;
  width: 100%;
}

.filter-button {
  padding: 5px 11px;

  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;

  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;

  transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
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

.filter-more,
.filter-clear {
  padding: 5px 4px;

  border: 0;
  background: transparent;

  color: var(--vp-c-brand-1);

  font-size: 12px;
  line-height: 1.4;

  cursor: pointer;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 640px) {
  .filter-group {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 6px;
  }

  .filter-label {
    padding-top: 0;
  }
}
</style>
