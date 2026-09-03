<script setup lang="ts">
import {computed, onMounted, onUnmounted, watch} from 'vue'
import {type Album, displayComposers, personHref, relatedCatalogueLinks} from '../../data/albums'
import StreamingPlayer from './StreamingPlayer.vue'

const props = defineProps<{ album: Album }>()
const emit = defineEmits<{ close: [] }>()
const composers = computed(() => displayComposers(props.album).map(name => ({name, href: personHref(name)})))
const artists = computed(() => props.album.artists.map(name => ({name, href: personHref(name)})))
const genres = computed(() => props.album.genre ? props.album.genre.split(';').map(value => value.trim()).filter(Boolean) : [])
const catalogues = computed(() => relatedCatalogueLinks(props.album))

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('close')
}

watch(() => props.album, () => {
  document.body.style.overflow = 'hidden'
}, {immediate: true})
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="album-modal-backdrop" @click.self="emit('close')">
      <section class="album-modal" role="dialog" aria-modal="true" :aria-label="album.title">
        <button class="album-modal-close" type="button" aria-label="Close album details" @click="emit('close')">×
        </button>
        <div class="album-modal-layout">
          <div class="album-modal-left">
            <div class="album-cover">
              <img v-if="album.cover" :src="album.cover" :alt="album.title" loading="lazy">
              <div v-else class="cover-placeholder"><span>{{ album.title || 'Album' }}</span></div>
              <div v-if="genres.length" class="album-modal-genre"><span v-for="genre in genres" :key="genre"
                                                                        class="genre-tag">{{ genre }}</span></div>
            </div>
            <div class="album-modal-info">
              <h2>{{ album.title }}</h2>
              <dl v-if="composers.length || artists.length" class="album-modal-facts">
                <template v-if="artists.length">
                  <dt>Artist</dt>
                  <dd>
                    <template v-for="(artist, index) in artists" :key="artist.name"><a v-if="artist.href"
                                                                                       :href="artist.href">{{
                        artist.name
                      }}</a><span v-else>{{ artist.name }}</span><span v-if="index < artists.length - 1"> · </span>
                    </template>
                  </dd>
                </template>
                <template v-if="composers.length">
                  <dt>Composer</dt>
                  <dd>
                    <template v-for="(composer, index) in composers" :key="composer.name"><a v-if="composer.href"
                                                                                             :href="composer.href">{{
                        composer.name
                      }}</a><span v-else>{{ composer.name }}</span><span v-if="index < composers.length - 1"> · </span>
                    </template>
                  </dd>
                </template>
              </dl>
              <div v-if="album.year || album.label || album.catalog_number" class="album-modal-metadata">
                {{ [album.year, album.label, album.catalog_number].filter(Boolean).join(' · ') }}
              </div>
              <nav v-if="catalogues.length" class="album-modal-related" aria-label="Related catalogues"><a
                  v-for="catalogue in catalogues" :key="catalogue.id" :href="catalogue.href">{{ catalogue.id }} <span
                  aria-hidden="true">→</span></a></nav>
            </div>
          </div>
          <StreamingPlayer
              :album="album"
          />
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.album-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--md-scrim) 55%, transparent);
  backdrop-filter: blur(5px);
}

.album-modal {
  position: relative;
  width: min(1020px, calc(100vw - 2.5rem));
  height: min(700px, calc(100vh - 2.5rem));
  overflow: hidden;
  padding: clamp(1.25rem, 3vw, 2.5rem);
  background: var(--md-surface-container-high);
  border-radius: var(--md-radius-lg);
  box-shadow: var(--md-shadow-3);
}

.album-modal-close {
  position: absolute;
  top: .75rem;
  right: .75rem;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--md-outline-variant);
  border-radius: 50%;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
  font-size: 1.35rem;
  cursor: pointer;
  transition: background var(--md-duration-fast) var(--md-ease), border-color var(--md-duration-fast) var(--md-ease);
}

.album-modal-close:hover {
  border-color: var(--md-outline);
  background: var(--md-surface-container-high);
}

.album-modal-layout {
  display: grid;
  grid-template-columns: minmax(230px, .88fr) minmax(310px, 1.12fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  height: 100%;
}

.album-cover {
  position: relative;
  height: 420px;
  overflow: hidden;
  background: var(--md-surface-container);
}

.album-cover img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: grid;
  height: 100%;
  place-items: center;
  padding: 1rem;
  color: var(--md-on-surface-variant);
  font-family: var(--font-ui);
  font-size: 1.7rem;
  text-align: center;
}

.album-modal-genre {
  position: absolute;
  right: .7rem;
  bottom: .7rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: .3rem;
}

.genre-tag {
  padding: .22rem .42rem;
  background: color-mix(in srgb, var(--md-inverse-surface) 88%, transparent);
  color: var(--md-inverse-on-surface);
  font-size: .68rem;
  border-radius: var(--md-radius-sm);
}

.album-modal-info h2 {
  margin: .8rem 2.5rem .7rem 0;
  font-family: var(--font-ui);
  font-size: clamp(1.6rem, 3vw, 2.4rem);
  font-weight: 500;
  line-height: 1.1;
}

.album-modal-facts {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: .35rem .75rem;
  margin: 0;
  font-size: .85rem;
}

.album-modal-facts dt {
  color: var(--md-outline);
  font-weight: 600;
}

.album-modal-facts dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-modal-facts dd a {
  white-space: nowrap;
}

.album-modal-metadata {
  margin-top: .65rem;
  overflow: hidden;
  color: var(--md-outline);
  font-size: .8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.album-modal-related {
  display: flex;
  flex-wrap: wrap;
  gap: .45rem;
  margin-top: .75rem;
}

.album-modal-related a {
  padding: .3rem .5rem;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-radius-sm);
  color: var(--md-on-surface-variant);
  font-size: .75rem;
  transition: border-color var(--md-duration-fast) var(--md-ease), color var(--md-duration-fast) var(--md-ease), background var(--md-duration-fast) var(--md-ease);
}

.album-modal-related a:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}

@media (max-width: 700px) {
  .album-modal {
    width: calc(100vw - 1.5rem);
    height: min(700px, calc(100vh - 1.5rem));
    padding: 1rem;
    overflow: auto;
  }

  .album-modal-layout {
    grid-template-columns: 1fr;
    height: auto;
  }

  .album-cover {
    height: min(42vw, 250px);
  }
}
</style>
