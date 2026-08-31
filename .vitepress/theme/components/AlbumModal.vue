<script setup lang="ts">
import {computed, onMounted, onUnmounted, watch} from 'vue'
import {type Album, displayComposers, personHref, relatedCatalogueLinks} from '../data/albums'
import StreamingPlayer from './StreamingPlayer.vue'

const props = defineProps<{
  album: Album
}>()

const emit = defineEmits<{
  close: []
}>()

const composers = computed(() =>
    displayComposers(props.album).map(name => ({
      name,
      href: personHref(name)
    }))
)

const artists = computed(() =>
    props.album.artists.map(name => ({
      name,
      href: personHref(name)
    }))
)
const genres = computed(() =>
    props.album.genre
        ? props.album.genre
            .split(';')
            .map(value => value.trim())
            .filter(Boolean)
        : []
)
const catalogues = computed(() => relatedCatalogueLinks(props.album))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(
    () => props.album,
    () => {
      document.body.style.overflow = 'hidden'
    },
    {immediate: true}
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="album-modal-backdrop" @click.self="emit('close')">
      <section
          class="album-modal"
          role="dialog"
          aria-modal="true"
          :aria-label="album.title"
      >
        <button
            class="album-modal-close"
            type="button"
            aria-label="Close album details"
            @click="emit('close')"
        >
          ×
        </button>

        <div class="album-modal-layout">

          <!-- Left: cover + album information -->
          <div class="album-modal-left">

            <div class="album-cover">
              <img
                  v-if="album.cover"
                  :src="album.cover"
                  :alt="album.title"
                  loading="lazy"
              >
              <div v-if="album.genre" class="album-modal-genre">
                <span
                    v-for="genre in album.genre.split(';').map(v => v.trim()).filter(Boolean)"
                    :key="genre"
                    class="genre-tag"
                >
                  {{ genre }}
                </span>
              </div>
              <div v-else class="cover-placeholder">
                <span>{{ album.title || 'Album' }}</span>
              </div>
            </div>

            <div class="album-modal-info">

              <h2>{{ album.title }}</h2>

              <dl
                  v-if="composers.length || artists.length"
                  class="album-modal-facts"
              >
                <template v-if="artists.length">
                  <dt>Artist</dt>
                  <dd>
                    <template
                        v-for="(artist, index) in artists"
                        :key="artist.name"
                    >
                      <a
                          v-if="artist.href"
                          :href="artist.href"
                      >
                        {{ artist.name }}
                      </a>

                      <span v-else>
                {{ artist.name }}
              </span>

                      <span v-if="index < artists.length - 1">
                ·
              </span>
                    </template>
                  </dd>
                </template>
                <template v-if="composers.length">
                  <dt>Composer</dt>
                  <dd>
                    <template
                        v-for="(composer, index) in composers"
                        :key="composer.name"
                    >
                      <a
                          v-if="composer.href"
                          :href="composer.href"
                      >
                        {{ composer.name }}
                      </a>

                      <span v-else>
                {{ composer.name }}
              </span>

                      <span v-if="index < composers.length - 1">
                ·
              </span>
                    </template>
                  </dd>
                </template>


              </dl>

              <!-- Publication metadata -->
              <div class="album-modal-metadata">
        <span v-if="album.year">
          {{ album.year }}
        </span>

                <span v-if="album.year && album.label"> · </span>

                <span v-if="album.label">
          {{ album.label }}
        </span>

                <span
                    v-if="
            (album.year || album.label) &&
            album.catalog_number
          "
                >
          ·
        </span>

                <span v-if="album.catalog_number">
          {{ album.catalog_number }}
        </span>
              </div>

              <nav
                  v-if="catalogues.length"
                  class="album-modal-related"
                  aria-label="Related catalogues"
              >
                <a
                    v-for="catalogue in catalogues"
                    :key="catalogue.id"
                    :href="catalogue.href"
                >
                  {{ catalogue.id }}
                </a>
              </nav>

            </div>
          </div>

          <!-- Right: streaming -->
          <div class="album-modal-streaming">
            <StreamingPlayer :album="album"/>
          </div>

        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.album-cover {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
}

.album-cover::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;

  background: rgba(0, 0, 0, 0.28);
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}



.album-modal-genre {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 12px;
  z-index: 10;

  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;

  padding: 0;
  margin: 0;
  background: transparent;
  border: 0;

  opacity: 0;
  transition: opacity 0.01s ease;
  pointer-events: none;
}

.album-cover:hover .album-modal-genre {
  opacity: 1;
}

.album-cover::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 2;

  background: rgba(0, 0, 0, 0.20);

  opacity: 0;

  pointer-events: none;
}

.genre-tag {
  font-size: 12px;
  font-weight: bold;
  padding: 5px 11px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.15);
  color: #fff;

  backdrop-filter: blur(1px) saturate(100%);

  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.album-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.58);
}

.album-modal {
  position: relative;
  width: min(900px, 100%);
  max-height: min(860px, 90vh);
  overflow: auto;
  padding: 28px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.24);
}

.album-modal-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  padding: 2.5px 10px;
  border: 0px solid var(--vp-c-divider);
  background: transparent 1%;
  color: var(--vp-c-text-2);
  font-size: 24px;
  cursor: pointer;
}

.album-modal-layout {
  display: grid;
  grid-template-columns: minmax(240px, 0.9fr) minmax(280px, 1.15fr);
  gap: 28px;
  align-items: start;
}

.album-modal-cover img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  padding: 24px;
  text-align: center;
  color: var(--vp-c-text-2);
}

.album-modal-info {
  margin-top: 12px;
  padding: 16px 18px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.album-modal-info h2 {
  text-align: center;
  margin: 0 0 14px;
  font-size: 20px;
  line-height: 1.35;
  color: var(--vp-c-text-1);
}

.album-modal-facts {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 8px 12px;
  margin: 0 0 16px;
}

.album-modal-facts dt {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-3);
}

.album-modal-facts dd {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.album-modal-metadata {
  text-align: center;
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-1);
}

.album-modal-related {
  justify-content: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 18px;
}

.album-modal-related a {
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.album-modal-related a:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

@media (max-width: 800px) {
  .album-modal {
    padding: 20px;
  }

  .album-modal-layout {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .album-modal h2 {
    margin-right: 32px;
    font-size: 22px;
  }

  .album-modal-facts {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }

  .album-modal-facts dd {
    margin-bottom: 8px;
  }
}
</style>
