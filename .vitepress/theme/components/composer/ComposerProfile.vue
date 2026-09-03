<script setup lang="ts">
import { computed } from 'vue'
import { Search } from '@element-plus/icons-vue'
import WikipediaIntro from '../common/WikipediaIntro.vue'
import ThemeSelector from '../common/ThemeSelector.vue'
import { albumCollectionsLink } from '../../data/albums'
import { catalogueLink, cataloguesByComposerSlug } from '../../data/catalogues'
import { composerBySlug, composers, nationalityToEmoji, wikipediaPage } from '../../data/composers'

const props = defineProps<{ slug: string }>()

const composer = computed(() => composerBySlug(props.slug))
const catalogues = computed(() => cataloguesByComposerSlug(props.slug))

const prevNext = computed(() => {
  const index = composers.findIndex(c => c.slug === props.slug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: index > 0 ? composers[index - 1] : null,
    next: index < composers.length - 1 ? composers[index + 1] : null
  }
})

const chips = computed(() => {
  const c = composer.value
  if (!c) return []
  const result: { label: string; value: string; emoji?: string }[] = []
  if (c.period) result.push({ label: 'Period', value: c.period })
  if (c.era) result.push({ label: 'Era', value: c.era })
  if (c.nationality) result.push({ label: 'Nationality', value: c.nationality, emoji: nationalityToEmoji(c.nationality) })
  return result
})

const musicbrainzSearchUrl = computed(() => {
  const c = composer.value
  if (!c) return ''
  return `https://musicbrainz.org/search?query=${encodeURIComponent(c.name)}&type=artist`
})
</script>

<template>
    <section v-if="composer" class="composer-profile">
    <!-- Header with actions -->
    <header class="composer-header">
      <div class="composer-header-actions">
        <a
            v-if="musicbrainzSearchUrl"
            :href="musicbrainzSearchUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="header-action"
            title="Search on MusicBrainz"
        >
          <el-icon class="header-action-icon"><Search /></el-icon>
          <span class="header-action-label">MusicBrainz</span>
        </a>
        <ThemeSelector />
      </div>
    </header>

    <!-- Related pages nav -->
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

    <!-- Composer chips (Period / Era / Nationality) -->
    <div v-if="chips.length" class="composer-chips">
      <span
          v-for="chip in chips"
          :key="chip.label"
          class="chip"
          :title="chip.label === 'Nationality' ? chip.value : undefined"
      >
        <span v-if="chip.emoji" class="chip-emoji" aria-hidden="true">{{ chip.emoji }}</span>
        {{ chip.value }}
      </span>
    </div>

    <!-- Introduction -->
    <p v-if="composer.intro" class="composer-summary">{{ composer.intro }}</p>

        <!-- Wikipedia intro -->
    <WikipediaIntro :page="wikipediaPage(composer)" />

    <!-- Prev / Next composer navigation -->
    <nav v-if="prevNext.prev || prevNext.next" class="composer-nav" aria-label="Composer navigation">
      <a
        v-if="prevNext.prev"
        :href="`/pages/composers/${prevNext.prev.slug}`"
        class="composer-nav-link composer-nav-prev"
      >
        ← Previous composer
      </a>
      <a
        v-if="prevNext.next"
        :href="`/pages/composers/${prevNext.next.slug}`"
        class="composer-nav-link composer-nav-next"
      >
        Next composer →
      </a>
    </nav>
  </section>
</template>

<style scoped>
.composer-profile {
  margin: 0 0 24px;
}

/* ---- Header actions ---- */
.composer-header {
  display: flex;
  justify-content: flex-end;
  margin: 0 0 16px;
}

.composer-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant);
  font-size: 13px;
  font-family: var(--font-ui);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: border-color var(--md-duration-fast) var(--md-ease),
              color var(--md-duration-fast) var(--md-ease),
              background var(--md-duration-fast) var(--md-ease);
}

.header-action:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 6%, var(--md-surface));
}

.header-action:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

.header-action-icon {
  font-size: 16px;
}

.header-action-label {
  white-space: nowrap;
}

/* ---- Related pages nav ---- */
.composer-related {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 20px;
}

.composer-related a {
  padding: 6px 14px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  font-size: 12px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  text-decoration: none;
  transition: border-color var(--md-duration-fast) var(--md-ease),
              color var(--md-duration-fast) var(--md-ease),
              background var(--md-duration-fast) var(--md-ease);
}

.composer-related a:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

/* ---- Composer chips ---- */
.composer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 20px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-full);
  background: var(--md-surface-container-low);
  color: var(--md-on-surface-variant);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.chip-emoji {
  font-size: 14px;
  line-height: 1;
}

/* ---- Summary ---- */
.composer-summary {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--md-on-surface-variant);
}

/* ---- Composer prev/next navigation ---- */
.composer-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 24px 0;
  gap: 16px;
}

.composer-nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  text-decoration: none;
  border-radius: var(--md-radius-full);
  transition: color var(--md-duration-fast) var(--md-ease),
              background var(--md-duration-fast) var(--md-ease);
  white-space: nowrap;
}

.composer-nav-link:hover {
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

.composer-nav-link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

</style>