<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { parseCSV } from '../data/catalogues'
import { type Album, albumCollectionsLink, composerByName } from '../data/albums'
import { composerBySlug } from '../data/composers'
import AlbumCard from './AlbumCard.vue'
import AlbumModal from './AlbumModal.vue'

const albums = ref<Album[]>([])
const loading = ref(true)
const error = ref('')
const searchText = ref('')
const selectedComposerSlug = ref('')
const selectedAlbum = ref<Album | null>(null)
const showBackToTop = ref(false)
const sortBy = ref<'title-asc' | 'title-desc' | 'year-desc' | 'year-asc' | 'composer-asc'>('year-desc')

function toAlbum(data: Record<string, string>): Album {
  return {
    id: data.id || '',
    musicbrainz_id: data.musicbrainz_id || '',
    title: data.title || '',
    composer: data.composer
        ? data.composer.split(';').map(value => value.trim()).filter(Boolean)
        : [],
    artists: data.artists
        ? data.artists.split(';').map(value => value.trim()).filter(Boolean)
        : [],
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
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/data/albums.csv')
    if (!response.ok) {
      throw new Error(`Failed to load albums.csv: HTTP ${response.status}`)
    }

    const rows = parseCSV(await response.text())
    if (rows.length < 2) {
      albums.value = []
      return
    }

    const headers = rows[0].map(header => header.replace(/^\uFEFF/, '').trim())
    albums.value = rows.slice(1).map(row => {
      const data: Record<string, string> = {}
      headers.forEach((header, index) => {
        data[header] = row[index] ?? ''
      })
      return toAlbum(data)
    })
  } catch (cause) {
    albums.value = []
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    loading.value = false
  }
}

function composerSlugFromQuery(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('composer')?.trim() || ''
}

function applyComposerQuery() {
  const slug = composerSlugFromQuery()
  selectedComposerSlug.value = composerBySlug(slug) ? slug : ''
}

function setComposerFilter(slug: string) {
  selectedComposerSlug.value = slug
  if (typeof window === 'undefined') return
  window.history.replaceState({}, '', albumCollectionsLink(slug || undefined))
}

const composerOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const album of albums.value) {
    for (const name of album.composer) {
      const composer = composerByName(name)
      if (composer?.slug && !seen.has(composer.slug)) {
        seen.set(composer.slug, composer.name)
      }
    }
  }
  return [...seen.entries()]
      .map(([slug, name]) => ({ slug, name }))
      .sort((a, b) => a.name.localeCompare(b.name))
})

const filteredAlbums = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  const slug = selectedComposerSlug.value

  return albums.value.filter(album => {
    if (slug && !album.composer.some(name => composerByName(name)?.slug === slug)) {
      return false
    }

    if (!keyword) return true

    return [
      album.title,
      ...album.composer,
      ...album.artists,
      album.label,
      album.catalog_number,
    ].join(' ').toLowerCase().includes(keyword)
  })
})

const sortedAlbums = computed(() => {
  const result = [...filteredAlbums.value]

  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'title-asc':
        return a.title.localeCompare(b.title)

      case 'title-desc':
        return b.title.localeCompare(a.title)

      case 'year-desc':
        return (Number(b.year) || 0) - (Number(a.year) || 0)

      case 'year-asc':
        return (Number(a.year) || 0) - (Number(b.year) || 0)

      case 'composer-asc':
        return (a.composer[0] || '').localeCompare(
            b.composer[0] || ''
        )

      default:
        return 0
    }
  })

  return result
})

function openAlbum(album: Album) {
  selectedAlbum.value = album
}

function closeAlbum() {
  selectedAlbum.value = null
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function updateBackToTopVisibility() {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  applyComposerQuery()
  loadAlbums()
  window.addEventListener('popstate', applyComposerQuery)
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
  updateBackToTopVisibility()
})

onUnmounted(() => {
  window.removeEventListener('popstate', applyComposerQuery)
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
        <input
            v-model="searchText"
            type="search"
            placeholder="Search by title, composer, or artist"
            class="album-search"
        >
        <select
            v-if="composerOptions.length"
            class="album-select"
            :value="selectedComposerSlug"
            @change="setComposerFilter(($event.target as HTMLSelectElement).value)"
        >
          <option value="">All composers</option>
          <option
              v-for="composer in composerOptions"
              :key="composer.slug"
              :value="composer.slug"
          >
            {{ composer.name }}
          </option>
        </select>
        <select
            v-model="sortBy"
            class="album-select"
            aria-label="Sort albums"
        >
          <option value="title-asc">
            Title: Ascend
          </option>

          <option value="title-desc">
            Title: Descend
          </option>

          <option value="year-desc">
            Year: Newest first
          </option>

          <option value="year-asc">
            Year: Oldest first
          </option>
        </select>
      </div>

      <div class="album-result-count">
        {{ filteredAlbums.length }}
        {{ filteredAlbums.length === 1 ? 'album' : 'albums' }}
      </div>

      <div v-if="sortedAlbums.length" class="album-gallery">
        <AlbumCard
            v-for="album in sortedAlbums"
            :key="album.id"
            :album="album"
            @open="openAlbum(album)"
        />
      </div>
      <div v-else class="album-state">No albums match the current filters.</div>
    </div>
  </div>

  <AlbumModal
      v-if="selectedAlbum"
      :album="selectedAlbum"
      @close="closeAlbum"
  />

  <button
      v-if="showBackToTop"
      class="back-to-top"
      type="button"
      @click="scrollToTop"
  >
    Back to top
  </button>
</template>

<style scoped>
.album-list-wrapper {
  width: 100%;
}

.album-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.album-search,
.album-select {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-size: 14px;
  outline: none;
}

.album-search {
  flex: 1 1 240px;
  min-width: 180px;
}

.album-select {
  flex: 0 1 auto;
  min-width: 180px;
}

.album-search:focus,
.album-select:focus {
  border-color: var(--vp-c-brand-1);
}

.album-result-count {
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}

.album-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  width: 100%;
}

.back-to-top {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 20;
  padding: 8px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.album-state {
  padding: 40px;
  text-align: center;
  color: var(--vp-c-text-3);
}

.album-error {
  color: var(--vp-c-danger-1);
}

@media (max-width: 480px) {
  .album-gallery {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }
}
</style>
