<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
interface Album {
  id: string
  musicbrainz_id: string
  title: string
  composer: string[]
  artists: string[]
  label: string
  catalog_number: string
  year: string
  country: string
  format: string
  barcode: string
  track_count: string
  cover: string
  spotify: string
  apple_music: string
  qobuz: string
}

const albums = ref<Album[]>([])
const loading = ref(true)
const error = ref('')

/* =========================
   CSV Parser
   ========================= */

function parseCSV(text: string): string[][] {
  const rows: string[][] = []

  let row: string[] = []
  let field = ''
  let insideQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (insideQuotes && next === '"') {
        field += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (char === ',' && !insideQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if (
        (char === '\n' || char === '\r') &&
        !insideQuotes
    ) {
      if (char === '\r' && next === '\n') {
        i++
      }

      row.push(field)
      field = ''

      if (row.some(value => value !== '')) {
        rows.push(row)
      }

      row = []

      continue
    }

    field += char
  }

  // 最后一行
  if (field !== '' || row.length > 0) {
    row.push(field)

    if (row.some(value => value !== '')) {
      rows.push(row)
    }
  }

  return rows
}


/* =========================
   Load Albums
   ========================= */

async function loadAlbums() {
  loading.value = true
  error.value = ''

  try {
    const response = await fetch('/data/albums.csv')

    if (!response.ok) {
      throw new Error(
          `Failed to load albums.csv: HTTP ${response.status}`
      )
    }

    const text = await response.text()

    const rows = parseCSV(text)

    if (rows.length < 2) {
      albums.value = []
      return
    }

    const headers = rows[0]

    const dataRows = rows.slice(1)

    albums.value = dataRows.map(row => {

      const data: Record<string, string> = {}

      headers.forEach((header, index) => {
        data[header] = row[index] ?? ''
      })

      return {
        id: data.id,

        musicbrainz_id:
        data.musicbrainz_id,

        title:
        data.title,

        composer:
            data.composer
                ? data.composer
                    .split(';')
                    .map(composer => composer.trim())
                    .filter(Boolean)
                : [],

        artists:
            data.artists
                ? data.artists
                    .split(';')
                    .map(artist => artist.trim())
                    .filter(Boolean)
                : [],

        label:
        data.label,

        catalog_number:
        data.catalog_number,

        year:
        data.year,

        country:
        data.country,

        format:
        data.format,

        barcode:
        data.barcode,

        track_count:
        data.track_count,

        cover:
        data.cover,

        spotify:
        data.spotify,

        apple_music:
        data.apple_music,

        qobuz:
        data.qobuz
      }
    })

  } catch (err) {

    console.error(err)

    error.value =
        err instanceof Error
            ? err.message
            : String(err)

  } finally {

    loading.value = false

  }
}


onMounted(() => {
  loadAlbums()
})

const searchText = ref('')
const selectedComposer = ref('')
const selectedLabel = ref('')
const selectedFormat = ref('')
const sortBy = ref('default')

function uniqueAlbumValues(
    field: 'composer' | 'label' | 'format'
) {
  return [...new Set(
      albums.value
          .flatMap(album => {
            const value = album[field]
            return Array.isArray(value) ? value : [value]
          })
          .map(value => value.trim())
          .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b))
}

const composers = computed(() =>
    uniqueAlbumValues('composer')
)

const labels = computed(() =>
    uniqueAlbumValues('label')
)

const formats = computed(() =>
    uniqueAlbumValues('format')
)

const filteredAlbums = computed(() => {

  let result = [...albums.value]

  /* Search */

  const keyword =
      searchText.value
          .trim()
          .toLowerCase()

  if (keyword) {

    result = result.filter(album => {

      const text = [
        album.title,
        ...album.composer,
        ...album.artists,
        album.label,
        album.catalog_number,
        album.barcode
      ]
          .join(' ')
          .toLowerCase()

      return text.includes(keyword)
    })
  }


  /* Composer */

  if (selectedComposer.value) {

    result = result.filter(
        album =>
            album.composer.includes(selectedComposer.value)
    )
  }


  /* Label */

  if (selectedLabel.value) {

    result = result.filter(
        album =>
            album.label === selectedLabel.value
    )
  }


  /* Format */

  if (selectedFormat.value) {

    result = result.filter(
        album =>
            album.format === selectedFormat.value
    )
  }


  /* Sort */

  switch (sortBy.value) {

    case 'year-desc':

      result.sort(
          (a, b) =>
              Number(b.year) - Number(a.year)
      )

      break


    case 'year-asc':

      result.sort(
          (a, b) =>
              Number(a.year) - Number(b.year)
      )

      break


    case 'title-asc':

      result.sort(
          (a, b) =>
              a.title.localeCompare(
                  b.title
              )
      )

      break


    case 'composer-asc':

      result.sort(
          (a, b) =>
              a.composer.join(' · ').localeCompare(
                  b.composer.join(' · ')
              )
      )

      break
  }


  return result
})
/* =========================
   Streaming
   ========================= */

function hasStreaming(album: Album) {
  return Boolean(
      album.spotify ||
      album.apple_music ||
      album.qobuz
  )
}

</script>


<template>

  <div class="album-list-wrapper">

    <!-- Loading -->

    <div
        v-if="loading"
        class="album-state"
    >
      Loading albums...
    </div>


    <!-- Error -->

    <div
        v-else-if="error"
        class="album-state album-error"
    >
      {{ error }}
    </div>


    <!-- Empty -->

    <div
        v-else-if="albums.length === 0"
        class="album-state"
    >
      No albums found.
    </div>


    <!-- Album List -->

    <!-- Album List -->

    <div v-else>

      <!-- =========================
           Filters
           ========================= -->

      <div class="album-toolbar">

        <!-- Search -->

        <input
            v-model="searchText"
            type="search"
            placeholder="Search albums..."
            class="album-search"
        />


        <!-- Composer -->

        <select
            v-model="selectedComposer"
            class="album-select"
        >

          <option value="">
            All composers
          </option>

          <option
              v-for="composer in composers"
              :key="composer"
              :value="composer"
          >
            {{ composer }}
          </option>

        </select>


        <!-- Label -->

        <select
            v-model="selectedLabel"
            class="album-select"
        >

          <option value="">
            All labels
          </option>

          <option
              v-for="label in labels"
              :key="label"
              :value="label"
          >
            {{ label }}
          </option>

        </select>


        <!-- Format -->

        <select
            v-model="selectedFormat"
            class="album-select"
        >

          <option value="">
            All formats
          </option>

          <option
              v-for="format in formats"
              :key="format"
              :value="format"
          >
            {{ format }}
          </option>

        </select>


        <!-- Sort -->

        <select
            v-model="sortBy"
            class="album-select"
        >

          <option value="default">
            Default order
          </option>

          <option value="year-desc">
            Year: newest first
          </option>

          <option value="year-asc">
            Year: oldest first
          </option>

          <option value="title-asc">
            Title: A → Z
          </option>

          <option value="composer-asc">
            Composer: A → Z
          </option>

        </select>

      </div>


      <!-- Result Count -->

      <div class="album-result-count">

        {{ filteredAlbums.length }}
        {{ filteredAlbums.length === 1 ? 'album' : 'albums' }}

      </div>


      <!-- Albums -->

      <div class="album-list">

        <div
            v-for="album in filteredAlbums"
            :key="album.id"
            class="album-card"
        >

        <!-- =========================
             Cover
             ========================= -->

        <div class="album-cover">

          <a
              v-if="album.cover"
              :href="album.cover"
              target="_blank"
              rel="noopener noreferrer"
              class="album-cover-link"
          >

            <img
                :src="album.cover"
                :alt="album.title"
                loading="lazy"
            />

          </a>


          <div
              v-else
              class="cover-placeholder"
          >

            <span>
              {{ album.composer.join(' · ') || 'Album' }}
            </span>

          </div>

        </div>


        <!-- =========================
             Album Info
             ========================= -->

        <div class="album-info">

          <!-- Composer -->

          <div
              v-if="album.composer.length"
              class="album-composer"
          >
            {{ album.composer.join(' · ') }}
          </div>


          <!-- Title -->

          <div class="album-title">
            {{ album.title }}
          </div>


          <!-- Artists -->

          <div
              v-if="album.artists.length"
              class="album-artists"
          >
            {{ album.artists.join(' · ') }}
          </div>


          <!-- Metadata -->

          <div class="album-meta">

            <span v-if="album.year">
              {{ album.year }}
            </span>

            <span
                v-if="
                album.year &&
                album.label
              "
            >
              ·
            </span>

            <span v-if="album.label">
              {{ album.label }}
            </span>

            <span
                v-if="
                album.label &&
                album.catalog_number
              "
            >
              ·
            </span>

            <span
                v-if="album.catalog_number"
            >
              {{ album.catalog_number }}
            </span>

            <span
                v-if="
                album.catalog_number &&
                album.format
              "
            >
              ·
            </span>

            <span v-if="album.format">
              {{ album.format }}
            </span>

          </div>


          <!-- Country / Barcode -->

          <div
              v-if="
              album.country ||
              album.barcode
            "
              class="album-secondary-meta"
          >

            <span v-if="album.country">
              {{ album.country }}
            </span>

            <span
                v-if="
                album.country &&
                album.barcode
              "
            >
              ·
            </span>

            <span v-if="album.barcode">
              {{ album.barcode }}
            </span>

          </div>


          <!-- =========================
               Streaming
               ========================= -->

          <div
              v-if="hasStreaming(album)"
              class="streaming-links"
          >

            <a
                v-if="album.spotify"
                :href="album.spotify"
                target="_blank"
                rel="noopener noreferrer"
                class="streaming-dot spotify"
                title="Spotify"
                @click.stop
            ></a>


            <a
                v-if="album.apple_music"
                :href="album.apple_music"
                target="_blank"
                rel="noopener noreferrer"
                class="streaming-dot apple-music"
                title="Apple Music"
                @click.stop
            ></a>


            <a
                v-if="album.qobuz"
                :href="album.qobuz"
                target="_blank"
                rel="noopener noreferrer"
                class="streaming-dot qobuz"
                title="Qobuz"
                @click.stop
            ></a>

          </div>

        </div>

      </div>

      </div>

    </div>

  </div>

</template>


<style scoped>

/* =========================
   Wrapper
   ========================= */

.album-list-wrapper {
  width: 100%;
}


/* =========================
   Album List
   ========================= */

.album-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
}

/* =========================
   Album Toolbar
   ========================= */

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

  border:
      1px solid
      var(--vp-c-divider);

  border-radius: 8px;

  background:
      var(--vp-c-bg-soft);

  color:
      var(--vp-c-text-1);

  font-size: 14px;

  outline: none;

  transition:
      border-color 0.18s ease,
      background 0.18s ease;
}


.album-search {
  flex: 1 1 240px;

  min-width: 180px;
}


.album-select {
  flex: 0 1 auto;

  min-width: 150px;
}


.album-search:focus,
.album-select:focus {
  border-color:
      var(--vp-c-brand-1);
}


/* =========================
   Result Count
   ========================= */

.album-result-count {
  margin-bottom: 14px;

  font-size: 13px;

  color:
      var(--vp-c-text-3);
}

/* =========================
   Album Card
   ========================= */

.album-card {
  display: flex;

  width: 100%;
  min-width: 0;

  overflow: hidden;

  border:
      1px solid
      var(--vp-c-divider);

  border-radius: 10px;

  background:
      var(--vp-c-bg-soft);

  transition:
      transform 0.18s ease,
      border-color 0.18s ease,
      box-shadow 0.18s ease;
}


.album-card:hover {
  transform: translateY(-2px);

  border-color:
      var(--vp-c-brand-1);

  box-shadow:
      0 8px 24px
      rgba(0, 0, 0, 0.08);
}


/* =========================
   Cover
   ========================= */

.album-cover {
  flex: 0 0 200px;

  width: 200px;
  aspect-ratio: 1 / 1;

  overflow: hidden;

  background:
      var(--vp-c-bg-mute);
}


.album-cover-link {
  display: block;

  width: 100%;
  height: 100%;

  line-height: 0;

  overflow: hidden;
}


.album-cover img {
  display: block;

  width: 100%;
  height: 100%;

  object-fit: cover;

  transition:
      transform 0.25s ease;
}


.album-card:hover
.album-cover img {
  transform: scale(1.03);
}


/* =========================
   Placeholder
   ========================= */

.cover-placeholder {
  width: 100%;
  height: 100%;

  display: flex;

  align-items: center;
  justify-content: center;

  padding: 24px;

  box-sizing: border-box;

  text-align: center;

  background:
      linear-gradient(
          135deg,
          var(--vp-c-bg-soft),
          var(--vp-c-bg-mute)
      );

  color:
      var(--vp-c-text-2);

  font-size: 14px;
}


/* =========================
   Album Info
   ========================= */

.album-info {
  display: flex;

  flex-direction: column;

  justify-content: center;

  min-width: 0;

  padding: 28px 56px;
}


.album-composer {
  margin-bottom: 4px;

  font-size: 14px;

  line-height: 1.5;

  color:
      var(--vp-c-text-3);
}


.album-title {
  font-size: 25px;

  font-weight: 650;

  line-height: 1.4;

  color:
      var(--vp-c-text-1);
}


.album-artists {
  margin-top: 8px;

  font-size: 16px;

  line-height: 1.5;

  color:
      var(--vp-c-text-2);
}


/* =========================
   Metadata
   ========================= */

.album-meta {
  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin-top: 16px;

  font-size: 14px;

  line-height: 1.5;

  color:
      var(--vp-c-text-3);
}


.album-secondary-meta {
  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin-top: 5px;

  font-size: 12px;

  color:
      var(--vp-c-text-3);
}


/* =========================
   Streaming
   ========================= */

.streaming-links {
  display: flex;

  align-items: center;

  gap: 30px;

  margin-top: 18px;
}


.streaming-dot {
  width: 12px;
  height: 12px;

  display: block;

  flex-shrink: 0;

  border-radius: 50%;

  opacity: 0.7;

  animation:
      streaming-pulse
      4s ease-in-out infinite;
}


.streaming-dot:nth-child(1) {
  animation-delay: 0s;
}


.streaming-dot:nth-child(2) {
  animation-delay: 2s;
}


.streaming-dot:nth-child(3) {
  animation-delay: 4s;
}


.streaming-dot:hover {
  transform:
      scale(1.4);

  opacity: 1;
}


.spotify {
  background:
      #1DB954;
}


.apple-music {
  background:
      #FA243C;
}


.qobuz {
  background:
      #000;
}


@keyframes streaming-pulse {

  0%,
  100% {
    transform:
        translateY(0)
        scale(1);

    opacity: 0.55;
  }

  50% {
    transform:
        translateY(-4px)
        scale(1);

    opacity: 1;
  }

}


@media (prefers-reduced-motion: reduce) {

  .streaming-dot {
    animation: none;
  }

}


/* =========================
   State
   ========================= */

.album-state {
  padding: 40px;

  text-align: center;

  color:
      var(--vp-c-text-3);
}


.album-error {
  color:
      var(--vp-c-danger-1);
}


/* =========================
   Responsive
   ========================= */

@media (max-width: 640px) {

  .album-card {
    flex-direction: column;
  }


  .album-cover {
    flex: none;

    width: 100%;

    aspect-ratio: 1 / 1;
  }


  .album-info {
    padding:
        20px;
  }


  .album-title {
    font-size: 19px;
  }


  .album-artists {
    font-size: 14px;
  }


  .album-meta {
    margin-top: 12px;
  }

}

</style>
