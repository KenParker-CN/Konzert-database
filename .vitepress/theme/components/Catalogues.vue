<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CatalogueTable from './CatalogueTable.vue'

const catalogues = [
  { id: 'RV', name: 'Ryom-Verzeichnis', composer: 'Antonio Vivaldi' },
  { id: 'TWV', name: 'Telemann-Werke-Verzeichnis', composer: 'Georg Philipp Telemann' },
  { id: 'HWV', name: 'Handel-Werke-Verzeichnis', composer: 'George Frideric Handel' },
  { id: 'KV', name: 'Köchel-Verzeichnis', composer: 'Wolfgang Amadeus Mozart' },
  { id: 'BWV', name: 'Bach-Werke-Verzeichnis', composer: 'Johann Sebastian Bach' }
] as const

type CatalogueId = typeof catalogues[number]['id']
const validIds = new Set<CatalogueId>(catalogues.map(catalogue => catalogue.id))
const selectedTab = ref<CatalogueId>('RV')
const selectedCatalogue = computed(() => catalogues.find(catalogue => catalogue.id === selectedTab.value) || catalogues[0])

function tabFromUrl(): CatalogueId {
  if (typeof window === 'undefined') return 'RV'
  const tab = new URLSearchParams(window.location.search).get('tab')?.toUpperCase() as CatalogueId
  return validIds.has(tab) ? tab : 'RV'
}

function selectTab(tab: CatalogueId) {
  if (tab === selectedTab.value && new URLSearchParams(window.location.search).get('tab') === tab) return
  selectedTab.value = tab
  window.history.pushState({}, '', `/catalogues?tab=${tab}`)
}

function syncTabFromHistory() {
  selectedTab.value = tabFromUrl()
}

onMounted(() => {
  syncTabFromHistory()
  if (!new URLSearchParams(window.location.search).has('tab')) {
    window.history.replaceState({}, '', `/catalogues?tab=${selectedTab.value}`)
  }
  window.addEventListener('popstate', syncTabFromHistory)
})

onBeforeUnmount(() => window.removeEventListener('popstate', syncTabFromHistory))
</script>

<template>
  <section class="catalogues">
    <div class="catalogue-tabs" role="tablist" aria-label="Work catalogues">
      <button
        v-for="catalogue in catalogues"
        :key="catalogue.id"
        type="button"
        role="tab"
        :aria-selected="selectedTab === catalogue.id"
        :class="{ active: selectedTab === catalogue.id }"
        @click="selectTab(catalogue.id)"
      >{{ catalogue.id }}</button>
    </div>
    <div role="tabpanel">
      <h2>{{ selectedCatalogue.name }}</h2>
      <p>{{ selectedCatalogue.composer }}</p>
      <CatalogueTable :key="selectedCatalogue.id" :catalogue="selectedCatalogue.id" />
    </div>
  </section>
</template>
