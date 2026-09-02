<script setup lang="ts">
import { ref, computed } from 'vue'

interface Album {
  id: string
  musicbrainz_id: string
  title: string
  composer: string
  artists: string[]
  label: string
  catalog_number: string
  year: string
  barcode: string
  spotify: string
  apple_music: string
  qobuz: string
}

const catno = ref('')
const barcode = ref('')
const title = ref('')
const artist = ref('')

const results = ref<any[]>([])
const albums = ref<Album[]>([])

const loading = ref(false)
const error = ref('')


/* =========================
   Search MusicBrainz
   ========================= */

async function searchMusicBrainz() {
  loading.value = true
  error.value = ''
  results.value = []

  try {
    const conditions: string[] = []

    if (catno.value.trim()) {
      conditions.push(`catno:"${catno.value.trim()}"`)
    }
    if (barcode.value.trim()) {
      conditions.push(`barcode:${barcode.value.trim()}`)
    }
    if (title.value.trim()) {
      conditions.push(`release:"${title.value.trim()}"`)
    }

    if (artist.value.trim()) {
      conditions.push(`artist:"${artist.value.trim()}"`)
    }


    if (conditions.length === 0) {
      throw new Error('Please enter at least one search condition')
    }

    const query = conditions.join(' AND ')

    const url =
        `https://musicbrainz.org/ws/2/release/` +
        `?query=${encodeURIComponent(query)}` +
        `&fmt=json` +
        `&limit=25`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (!data.releases?.length) {
      throw new Error('No release found')
    }

    results.value = data.releases

  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
}


/* =========================
   Select Release
   ========================= */

async function selectRelease(release: any) {
  loading.value = true
  error.value = ''

  try {
    /*
     * 防止重复添加
     */

    const alreadyAdded = albums.value.some(
        album =>
            album.musicbrainz_id === release.id
    )

    if (alreadyAdded) {
      throw new Error(
          'This release has already been added.'
      )
    }


    /*
     * 获取完整 Release
     */

    const url =
        `https://musicbrainz.org/ws/2/release/${release.id}` +
        `?inc=artists+labels+recordings+media+release-groups` +
        `&fmt=json`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const fullRelease = await response.json()


    /*
     * Artist credits
     */

    const credits =
        fullRelease['artist-credit'] ?? []

    const composer =
        credits[0]?.artist?.name ?? ''

    const artists = credits
        .slice(1)
        .map((credit: any) =>
            credit.artist?.name
        )
        .filter(Boolean)


    /*
     * Label
     */

    const labelName =
        fullRelease['label-info']?.[0]?.label?.name ?? ''

    const catalogNumber =
        fullRelease['label-info']?.[0]?.['catalog-number'] ?? ''


    /*
     * Create album
     */

    const newAlbum: Album = {

      id:
          `album-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,

      musicbrainz_id:
      fullRelease.id,

      title:
          fullRelease.title ?? '',

      composer,

      artists,

      label:
      labelName,

      catalog_number:
      catalogNumber,

      year:
          fullRelease.date?.slice(0, 4) ?? '',

      barcode:
          fullRelease.barcode ?? '',


      /*
       * These are intentionally empty for now.
       * We can fill them later.
       */


      spotify: '',

      apple_music: '',

      qobuz: ''
    }


    /*
     * Add to collection
     */

    albums.value.push(newAlbum)

  } catch (err) {
    error.value = String(err)
  } finally {
    loading.value = false
  }
}


/* =========================
   Remove album
   ========================= */

function removeAlbum(id: string) {
  albums.value =
      albums.value.filter(
          album => album.id !== id
      )
}


/* =========================
   Clear all
   ========================= */

function clearAlbums() {
  albums.value = []
}


/* =========================
   CSV
   ========================= */

const albumCount = computed(
    () => albums.value.length
)


function escapeCsv(
    value: string | number
) {
  return `"${String(value)
      .replace(/"/g, '""')}"`
}


function exportCsv() {

  if (!albums.value.length) {
    return
  }


  const headers = [

    'id',

    'musicbrainz_id',

    'title',

    'composer',

    'artists',

    'label',

    'catalog_number',

    'year',

    'country',

    'format',

    'barcode',

    'track_count',

    'cover',

    'spotify',

    'apple_music',

    'qobuz'
  ]


  const rows =
      albums.value.map(album => [

        album.id,

        album.musicbrainz_id,

        album.title,

        album.composer,

        album.artists.join(';'),

        album.label,

        album.catalog_number,

        album.year,

        album.barcode,


      ])


  const csv = [

    headers.join(','),

    ...rows.map(row =>
        row
            .map(escapeCsv)
            .join(',')
    )

  ].join('\n')


  const blob =
      new Blob(
          ['\ufeff' + csv],
          {
            type:
                'text/csv;charset=utf-8;'
          }
      )


  const url =
      URL.createObjectURL(blob)


  const link =
      document.createElement('a')

  link.href = url

  link.download =
      'albums.csv'

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

</script>


<template>

  <div class="mb-search">


    <!-- =========================
         Search
         ========================= -->

    <div class="search-fields">

      <input
          v-model="catno"
          placeholder="Catalog Number"
      />

      <input
          v-model="barcode"
          placeholder="Barcode"
      />

      <input
          v-model="title"
          placeholder="Title"
      />

      <input
          v-model="artist"
          placeholder="Artist"
      />


    </div>


    <button
        class="search-button"
        @click="searchMusicBrainz"
        :disabled="loading"
    >
      {{
        loading
            ? 'Searching...'
            : 'Search MusicBrainz'
      }}
    </button>


    <!-- =========================
         Error
         ========================= -->

    <p
        v-if="error"
        class="error"
    >
      {{ error }}
    </p>


    <!-- =========================
         Search Results
         ========================= -->

    <div
        v-if="results.length"
        class="results"
    >

      <h3>
        Search Results

        <span>
          ({{ results.length }})
        </span>
      </h3>


      <div
          v-for="release in results"
          :key="release.id"
          class="release-card"
      >

        <div class="release-info">

          <div class="release-title">

            {{ release.title }}

          </div>


          <div
              v-if="release['artist-credit']"
              class="release-artists"
          >

            {{
              release['artist-credit']
                  .map(
                      (credit: any) =>
                          credit.name
                  )
                  .join('')
            }}

          </div>


          <div class="release-meta">

            <span>
              {{
                release.date ||
                'Unknown date'
              }}
            </span>

            <span>·</span>

            <span>
              {{
                release.country ||
                'Unknown country'
              }}
            </span>

            <span>·</span>

            <span>
              {{
                release.media?.[0]?.format ||
                'Unknown format'
              }}
            </span>

          </div>


          <div
              v-if="release['label-info']?.length"
              class="release-label"
          >

            {{
              release['label-info'][0]
                  .label?.name
            }}

            ·

            {{
              release['label-info'][0]
                  ['catalog-number']
            }}

          </div>

        </div>


        <button
            class="select-button"
            @click="selectRelease(release)"
            :disabled="loading"
        >

          Select

        </button>

      </div>

    </div>


    <!-- =========================
         Collection
         ========================= -->

    <div
        v-if="albums.length"
        class="collection"
    >

      <div class="collection-header">

        <div>

          <h3>
            Selected Albums
          </h3>

          <span class="album-count">
            {{ albumCount }} album
            <span v-if="albumCount !== 1">
              s
            </span>
          </span>

        </div>


        <div class="collection-actions">

          <button
              class="clear-button"
              @click="clearAlbums"
          >
            Clear All
          </button>

          <button
              class="export-button"
              @click="exportCsv"
          >
            Export CSV
          </button>

        </div>

      </div>


      <!-- =========================
           Album list
           ========================= -->

      <div class="album-list">

        <div
            v-for="(album, index) in albums"
            :key="album.id"
            class="album-card"
        >

          <div class="album-number">

            {{ index + 1 }}

          </div>


          <div class="album-info">

            <div class="album-title">

              {{ album.title }}

            </div>


            <div class="album-artists">

              {{ album.artists.join(' · ') }}

            </div>


            <div class="album-meta">

              <span>
                {{ album.composer }}
              </span>

              <span>·</span>

              <span>
                {{ album.label }}
              </span>

              <span>·</span>

              <span>
                {{ album.catalog_number }}
              </span>

              <span>·</span>

              <span>
                {{ album.year }}
              </span>

              <span>·</span>
            </div>

          </div>


          <button
              class="remove-button"
              @click="removeAlbum(album.id)"
              title="Remove"
          >

            ×

          </button>

        </div>

      </div>

    </div>


    <!-- =========================
         Empty state
         ========================= -->

    <div
        v-else-if="!results.length"
        class="empty-state"
    >

      No albums selected yet.

    </div>


  </div>

</template>


<style scoped>

.mb-search {
  width: 100%;
}


/* =========================
   Search
   ========================= */

.search-fields {

  display: grid;

  grid-template-columns:
    repeat(2, minmax(0, 1fr));

  gap: 12px;

  margin-bottom: 14px;

}


.search-fields input {

  width: 100%;

  box-sizing: border-box;

  padding: 10px 12px;

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

}


.search-fields input:focus {

  border-color:
      var(--vp-c-brand-1);

}


/* =========================
   Buttons
   ========================= */

button {

  border: none;

  border-radius: 7px;

  padding: 9px 16px;

  cursor: pointer;

  font-size: 14px;

}


button:disabled {

  opacity: 0.5;

  cursor: not-allowed;

}


.search-button {

  background:
      var(--vp-c-brand-1);

  color: white;

}


.select-button {

  flex-shrink: 0;

  background:
      var(--vp-c-bg-mute);

  color:
      var(--vp-c-text-1);

}


.select-button:hover {

  background:
      var(--vp-c-brand-soft);

}


.export-button {

  background:
      var(--vp-c-brand-1);

  color: white;

}


.clear-button {

  background:
      var(--vp-c-bg-mute);

  color:
      var(--vp-c-text-2);

}


/* =========================
   Error
   ========================= */

.error {

  margin-top: 16px;

  color:
      var(--vp-c-danger-1);

}


/* =========================
   Search Results
   ========================= */

.results {

  margin-top: 28px;

}


.results h3 {

  margin-bottom: 12px;

}


.results h3 span {

  color:
      var(--vp-c-text-3);

  font-weight: normal;

}


.release-card {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  padding: 18px;

  margin-bottom: 10px;

  border:
      1px solid
      var(--vp-c-divider);

  border-radius: 10px;

  background:
      var(--vp-c-bg-soft);

  transition:
      border-color 0.18s ease,
      transform 0.18s ease;

}


.release-card:hover {

  border-color:
      var(--vp-c-brand-1);

  transform:
      translateY(-1px);

}


.release-info {

  min-width: 0;

}


.release-title {

  font-size: 17px;

  font-weight: 600;

  color:
      var(--vp-c-text-1);

}


.release-artists {

  margin-top: 5px;

  color:
      var(--vp-c-text-2);

  font-size: 14px;

}


.release-meta {

  display: flex;

  flex-wrap: wrap;

  gap: 6px;

  margin-top: 9px;

  color:
      var(--vp-c-text-3);

  font-size: 13px;

}


.release-label {

  margin-top: 6px;

  color:
      var(--vp-c-text-3);

  font-size: 13px;

}


/* =========================
   Collection
   ========================= */

.collection {

  margin-top: 36px;

  padding-top: 26px;

  border-top:
      1px solid
      var(--vp-c-divider);

}


.collection-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 16px;

}


.collection-header h3 {

  margin: 0;

}


.album-count {

  display: block;

  margin-top: 3px;

  color:
      var(--vp-c-text-3);

  font-size: 13px;

}


.collection-actions {

  display: flex;

  gap: 8px;

}


/* =========================
   Album List
   ========================= */

.album-list {

  display: flex;

  flex-direction: column;

  gap: 8px;

}


.album-card {

  display: flex;

  align-items: center;

  gap: 16px;

  padding: 14px 16px;

  border:
      1px solid
      var(--vp-c-divider);

  border-radius: 9px;

  background:
      var(--vp-c-bg-soft);

  transition:
      border-color 0.18s ease;

}


.album-card:hover {

  border-color:
      var(--vp-c-brand-1);

}


.album-number {

  flex: 0 0 28px;

  width: 28px;

  color:
      var(--vp-c-text-3);

  font-size: 13px;

  text-align: center;

}


.album-info {

  min-width: 0;

  flex: 1;

}


.album-title {

  font-size: 16px;

  font-weight: 600;

  color:
      var(--vp-c-text-1);

}


.album-artists {

  margin-top: 4px;

  color:
      var(--vp-c-text-2);

  font-size: 14px;

}


.album-meta {

  display: flex;

  flex-wrap: wrap;

  gap: 5px;

  margin-top: 6px;

  color:
      var(--vp-c-text-3);

  font-size: 12px;

}


.remove-button {

  flex: 0 0 auto;

  width: 32px;

  height: 32px;

  padding: 0;

  border-radius: 50%;

  background:
      transparent;

  color:
      var(--vp-c-text-3);

  font-size: 20px;

  line-height: 32px;

}


.remove-button:hover {

  background:
      var(--vp-c-bg-mute);

  color:
      var(--vp-c-danger-1);

}


/* =========================
   Empty
   ========================= */

.empty-state {

  margin-top: 28px;

  padding: 30px;

  border:
      1px dashed
      var(--vp-c-divider);

  border-radius: 10px;

  text-align: center;

  color:
      var(--vp-c-text-3);

}


/* =========================
   Mobile
   ========================= */

@media (max-width: 640px) {

  .search-fields {

    grid-template-columns: 1fr;

  }


  .release-card {

    align-items: flex-start;

    flex-direction: column;

  }


  .select-button {

    width: 100%;

  }


  .collection-header {

    align-items: flex-start;

    flex-direction: column;

  }


  .collection-actions {

    width: 100%;

  }


  .collection-actions button {

    flex: 1;

  }


  .album-card {

    align-items: flex-start;

  }


  .album-number {

    margin-top: 2px;

  }

}

</style>