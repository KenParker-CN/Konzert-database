<script setup lang="ts">
import { computed } from 'vue'
import WikipediaIntro from '../common/WikipediaIntro.vue'
import { albumCollectionsLink } from '../../data/albums'
import { catalogueLink, cataloguesByComposerSlug } from '../../data/catalogues'
import { composerBySlug, wikipediaPage } from '../../data/composers'

const props = defineProps<{ slug: string }>()

const composer = computed(() => composerBySlug(props.slug))
const catalogues = computed(() => cataloguesByComposerSlug(props.slug))

const facts = computed(() => {
  const current = composer.value
  if (!current) return []
  return [
    { label: 'Dates', value: `${current.born}–${current.died}` },
    { label: 'Era', value: current.era },
    { label: 'Period', value: current.period },
    { label: 'Nationality', value: current.nationality }
  ].filter(fact => Boolean(fact.value))
})
</script>

<template>
  <section v-if="composer" class="composer-profile">
    <p class="composer-back">
      <a href="/pages/composers">← All composers</a>
    </p>

    <nav class="composer-related" aria-label="Related pages">
      <a
          v-for="catalogue in catalogues"
          :key="catalogue.id"
          :href="catalogueLink(catalogue.id)"
      >
        {{ catalogue.id }}
      </a>
      <a :href="albumCollectionsLink(composer.slug)">Album collections</a>
    </nav>

    <dl class="composer-facts">
      <template v-for="fact in facts" :key="fact.label">
        <dt>{{ fact.label }}</dt>
        <dd>{{ fact.value }}</dd>
      </template>
    </dl>

    <p v-if="composer.intro" class="composer-summary">{{ composer.intro }}</p>

    <WikipediaIntro :page="wikipediaPage(composer)" />
  </section>
</template>

<style scoped>
.composer-profile {
  margin: 0 0 24px;
}

.composer-back {
  margin: 0 0 12px;

  font-size: 13px;
}

.composer-related {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 16px;
}

.composer-related a {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.composer-related a:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

.composer-facts {
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  gap: 6px 14px;

  margin: 0 0 18px;
  padding: 16px;

  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.composer-facts dt {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.composer-facts dd {
  margin: 0;

  font-size: 13px;
  color: var(--vp-c-text-1);
}

.composer-summary {
  margin: 0 0 18px;

  font-size: 14px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .composer-facts {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }

  .composer-facts dd {
    margin-bottom: 8px;
  }
}
</style>
