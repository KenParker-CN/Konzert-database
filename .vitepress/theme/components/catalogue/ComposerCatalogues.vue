<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  catalogueLink,
  cataloguesByComposerSlug,
  detectFilterFields,
  loadCatalogue,
  valuesOf,
  type CatalogueDefinition
} from '../../data/catalogues'

const props = defineProps<{ slug: string }>()

interface CatalogueSummary extends CatalogueDefinition {
  total: number
  types: string[]
}

const summaries = ref<CatalogueSummary[]>([])

onMounted(async () => {
  const entries = await Promise.all(cataloguesByComposerSlug(props.slug).map(async catalogue => {
    try {
      const { headers, works } = await loadCatalogue(catalogue.id)
      const typeField = detectFilterFields(headers, works).find(field => field.label === 'Type')
      const types = typeField
          ? [...new Set(works.flatMap(work => valuesOf(work, typeField)))].sort((a, b) => a.localeCompare(b, 'en'))
          : []
      return { ...catalogue, total: works.length, types }
    } catch (cause) {
      console.error(cause)
      return { ...catalogue, total: 0, types: [] }
    }
  }))

  summaries.value = entries
})
</script>

<template>
  <div v-if="summaries.length" class="composer-catalogues">
    <article v-for="catalogue in summaries" :key="catalogue.id" class="catalogue-card">
      <a class="catalogue-title" :href="catalogueLink(catalogue.id)">
        {{ catalogue.name }} ({{ catalogue.id }})
      </a>

      <p v-if="catalogue.total" class="catalogue-meta">{{ catalogue.total }} works</p>

      <p v-if="catalogue.types.length" class="catalogue-types">
        {{ catalogue.types.join(' · ') }}
      </p>
    </article>
  </div>
</template>

<style scoped>
.composer-catalogues {
  display: grid;
  gap: 12px;

  margin: 16px 0 24px;
}

.catalogue-card {
  padding: 16px 18px;

  background: var(--md-surface-container);
  border: 1px solid var(--md-outline-variant);
  border-radius: 12px;
}

.catalogue-title {
  font-size: 15px;
  font-weight: 600;
}

.catalogue-meta {
  margin: 6px 0 0;

  font-size: 13px;
  color: var(--md-on-surface-variant);
}

.catalogue-types {
  margin: 8px 0 0;

  font-size: 12px;
  line-height: 1.6;
  color: var(--md-outline);
}
</style>
