<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CatalogueTable from './CatalogueTable.vue'
import { albumCollectionsLink } from '../../data/albums'
import { catalogueIds, catalogues } from '../../data/catalogues'

const validIds = new Set(catalogueIds)
const selectedTab = ref(catalogueIds[0])
const selectedCatalogue = computed(() => catalogues.find(catalogue => catalogue.id === selectedTab.value) || catalogues[0])

function tabFromUrl(): string {
  if (typeof window === 'undefined') return catalogueIds[0]
  const tab = new URLSearchParams(window.location.search).get('tab')?.toUpperCase() || ''
  return validIds.has(tab) ? tab : catalogueIds[0]
}

function selectTab(tab: string) {
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
      <p class="catalogue-links">
        <a :href="`/pages/composers/${selectedCatalogue.composerSlug}`">{{ selectedCatalogue.composer }}</a>
        <span>·</span>
        <a :href="albumCollectionsLink(selectedCatalogue.composerSlug)">Album collections</a>
      </p>
      <CatalogueTable :key="selectedCatalogue.id" :catalogue="selectedCatalogue.id" />
    </div>
  </section>
</template>
