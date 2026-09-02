<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue'
import {parseCSV} from '../data/catalogues'
import {type Album, albumCollectionsLink, composerByName} from '../data/albums'
import {composerBySlug} from '../data/composers'
import AlbumCard from './AlbumCard.vue'
import AlbumModal from './AlbumModal.vue'

const albums = ref<Album[]>([])
const loading = ref(true)
const error = ref('')
const searchText = ref('')
const selectedComposerSlug = ref('')
const selectedAlbum = ref<Album | null>(null)
const activePlayerAlbum = ref<Album | null>(null)
const showBackToTop = ref(false)
const sortBy = ref<'title-asc' | 'title-desc' | 'year-desc' | 'year-asc' | 'composer-asc'>('year-desc')

function toAlbum(data: Record<string, string>): Album {
  return {
    id: data.id || '',
    musicbrainz_id: data.musicbrainz_id || '',
    title: data.title || '',
    composer: data.composer ? data.composer.split(';').map(value => value.trim()).filter(Boolean) : [],
    artists: data.artists ? data.artists.split(';').map(value => value.trim()).filter(Boolean) : [],
    label: data.label || '',
    catalog_number: data.catalog_number || '',
    year: data.year || '',
    country: data.country || '',
    genre: data.genre || '',
    barcode: data.barcode || '',
    track_count: data.track_count || '',
    cover: data.cover || '',
    spotify: data.spotify || '',
    apple_music: data.apple_music || '',
    tidal: data.tidal || ''
  }
}

async function loadAlbums() {
  loading.value = true;
  error.value = '';
  try {
    const response = await fetch('/data/albums.csv');
    if (!response.ok) throw new Error(`Failed to load albums.csv: HTTP ${response.status}`);
    const rows = parseCSV(await response.text());
    if (rows.length < 2) {
      albums.value = [];
      return
    }
    ;const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim());
    albums.value = rows.slice(1).map(row => {
      const data: Record<string, string> = {};
      headers.forEach((header, index) => {
        data[header] = row[index] ?? ''
      });
      return toAlbum(data)
    })
  } catch (cause) {
    albums.value = [];
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loading.value = false
  }
}
function getComposerSlug(name: string): string {

  const composer = composerByName(name)

  if (composer?.slug) {
    return composer.slug
  }

  return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
}
function composerSlugFromQuery(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('composer')?.trim() || ''
}

function applyComposerQuery() {
  const slug = composerSlugFromQuery();
  selectedComposerSlug.value = composerBySlug(slug) ? slug : ''
}

function setComposerFilter(slug: string) {
  selectedComposerSlug.value = slug;
  if (typeof window !== 'undefined') window.history.replaceState({}, '', albumCollectionsLink(slug || undefined))
}

const composerOptions = computed(() => {

  const seen = new Map<string,string>()

  for (const album of albums.value) {

    for (const name of album.composer) {

      const slug = getComposerSlug(name)

      if (!seen.has(slug)) {
        seen.set(slug, name)
      }

    }

  }

  return [...seen.entries()]
      .map(([slug,name]) => ({
        slug,
        name
      }))
      .sort((a,b)=>
          a.name.localeCompare(b.name)
      )

})
const filteredAlbums = computed(() => {

  const keyword =
      searchText.value.trim().toLowerCase()

  const slug =
      selectedComposerSlug.value


  return albums.value.filter(album => (

      (!slug ||
          album.composer.some(
              name =>
                  getComposerSlug(name) === slug
          ))

      &&

      (!keyword ||
          [
            album.title,
            ...album.composer,
            ...album.artists,
            album.label,
            album.catalog_number
          ]
              .join(' ')
              .toLowerCase()
              .includes(keyword)
      )

  ))

})
const sortedAlbums = computed(() => [...filteredAlbums.value].sort((a, b) => {
  switch (sortBy.value) {
    case 'title-asc':
      return a.title.localeCompare(b.title);
    case 'title-desc':
      return b.title.localeCompare(a.title);
    case 'year-desc':
      return (Number(b.year) || 0) - (Number(a.year) || 0);
    case 'year-asc':
      return (Number(a.year) || 0) - (Number(b.year) || 0);
    case 'composer-asc':
      return (a.composer[0] || '').localeCompare(b.composer[0] || '');
    default:
      return 0
  }
}))

async function openAlbum(album: Album) {
  activePlayerAlbum.value = album
  selectedAlbum.value = album
  await nextTick()
}

function closeAlbum() {
  selectedAlbum.value = null
}

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'})
}

function updateBackToTopVisibility() {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  applyComposerQuery();
  loadAlbums();
  window.addEventListener('popstate', applyComposerQuery);
  window.addEventListener('scroll', updateBackToTopVisibility, {passive: true});
  updateBackToTopVisibility()
})
onUnmounted(() => {
  window.removeEventListener('popstate', applyComposerQuery);
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>

<template>
  <div class="album-list-wrapper">
    <div v-if="loading" class="album-state">Loading albums...</div>
    <div v-else-if="error" class="album-state album-error">{{ error }}</div>
    <div v-else-if="albums.length === 0" class="album-state">No albums found.</div>
    <div v-else>
      <div class="album-toolbar">
        <label class="album-search-wrap"><span aria-hidden="true">⌕</span><input v-model="searchText" type="search"
                                                                                 placeholder="Search by title, composer, artist..."
                                                                                 class="album-search"
                                                                                 aria-label="Search albums"></label>
        <select v-if="composerOptions.length" class="album-select" :value="selectedComposerSlug"
                aria-label="Filter albums by composer"
                @change="setComposerFilter(($event.target as HTMLSelectElement).value)">
          <option value="">All composers</option>
          <option v-for="composer in composerOptions" :key="composer.slug" :value="composer.slug">{{
              composer.name
            }}
          </option>
        </select>
        <select v-model="sortBy" class="album-select" aria-label="Sort albums">
          <option value="title-asc">Title: Ascend</option>
          <option value="title-desc">Title: Descend</option>
          <option value="year-desc">Year: Newest first</option>
          <option value="year-asc">Year: Oldest first</option>
        </select>
      </div>
      <div class="album-result-count"><span>{{ filteredAlbums.length }}</span>
        {{ filteredAlbums.length === 1 ? 'recording' : 'recordings' }} in the collection
      </div>
      <div v-if="sortedAlbums.length" class="album-gallery">
        <AlbumCard v-for="album in sortedAlbums" :key="album.id" :album="album" @open="openAlbum(album)"/>
      </div>
      <div v-else class="album-state">No albums match the current filters.</div>
    </div>
  </div>
  <Transition name="album-modal">
    <AlbumModal v-if="selectedAlbum" :album="selectedAlbum" @close="closeAlbum"/>
  </Transition>
  <Transition name="back-top">
    <button v-if="showBackToTop" class="back-to-top" type="button" @click="scrollToTop"><span
        aria-hidden="true">↑</span> Back to top
    </button>
  </Transition>
</template>

<style scoped>
.album-toolbar {
  display: grid;
  grid-template-columns: minmax(230px, 1fr) minmax(150px, .45fr) minmax(150px, .42fr);
  gap: .65rem;
  margin: 0 0 1rem;
  padding: .8rem;
  border-top: 1px solid var(--archive-rule);
  border-bottom: 1px solid var(--archive-rule);
}

.album-search-wrap {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: 0 .75rem;
  border: 1px solid var(--archive-rule);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-3);
}

.album-search {
  width: 100%;
  height: 40px;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--archive-ink);
  font: inherit;
  font-size: .87rem;
}

.album-select {
  height: 42px;
  padding: 0 .65rem;
  border: 1px solid var(--archive-rule);
  border-radius: 0;
  background: var(--vp-c-bg-elv);
  color: var(--archive-ink);
  font: 12px var(--vp-font-family-base);
}

.album-search-wrap:focus-within, .album-select:focus {
  border-color: var(--archive-oxide);
  box-shadow: 3px 3px 0 var(--vp-c-brand-soft);
  outline: 0;
}

.album-result-count {
  margin: 0 0 1.2rem;
  color: var(--vp-c-text-3);
  font-size: 12px;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.album-result-count span {
  color: var(--archive-oxide);
  font-family: var(--vp-font-family-mono);
  font-size: 1.05em;
}

.album-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(174px, 1fr));
  gap: 1.8rem 1rem;
}

.album-state {
  padding: 3rem 1rem;
  border-top: 1px solid var(--archive-rule);
  border-bottom: 1px solid var(--archive-rule);
  color: var(--vp-c-text-3);
  text-align: center;
}

.album-error {
  color: var(--vp-c-danger-1);
}

.back-to-top {
  position: fixed;
  right: 1.25rem;
  bottom: 1.25rem;
  z-index: 20;
  display: flex;
  gap: .45rem;
  align-items: center;
  padding: .65rem .85rem;
  border: 1px solid var(--archive-ink);
  border-radius: 0;
  background: var(--archive-ink);
  color: var(--archive-paper);
  font: 700 11px var(--vp-font-family-base);
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform var(--archive-ease), background var(--archive-ease);
}

.back-to-top:hover {
  background: var(--archive-oxide);
  transform: translateY(-2px);
}

@media (max-width: 700px) {
  .album-toolbar {
    grid-template-columns: 1fr;
  }

  .album-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.4rem .8rem;
  }
}
</style>
