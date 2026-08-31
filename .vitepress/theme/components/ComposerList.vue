<script setup lang="ts">
import { computed, ref } from 'vue'

interface Composer {
  name: string
  born: number
  died: number
  era: string
  period: 'Early' | 'Middle' | 'Late'
  nationality: string
  intro: string
  slug?: string
  color: string
}

const props = defineProps<{
  era?: string
}>()


/* =========================
   Composer data
   ========================= */

const composers: Composer[] = [
  {
    name: 'Guillaume de Machaut',
    born: 1300,
    died: 1377,
    era: 'Medieval',
    period: 'Late',
    nationality: 'French',
    intro: 'A major French composer and poet of the Ars Nova period.',
    slug: 'machaut',
    color: '#8b5cf6'
  },

  {
    name: 'Guillaume Dufay',
    born: 1397,
    died: 1474,
    era: 'Renaissance',
    period: 'Early',
    nationality: 'Franco-Flemish',
    intro: 'One of the most influential composers of the early Renaissance.',
    slug: 'dufay',
    color: '#6366f1'
  },

  {
    name: 'Josquin des Prez',
    born: 1450,
    died: 1521,
    era: 'Renaissance',
    period: 'Middle',
    nationality: 'Franco-Flemish',
    intro: 'A leading composer of the High Renaissance, renowned for his vocal music.',
    slug: 'josquin',
    color: '#4f46e5'
  },

  {
    name: 'Claudio Monteverdi',
    born: 1567,
    died: 1643,
    era: 'Renaissance',
    period: 'Late',
    nationality: 'Italian',
    intro: 'A pivotal composer in the transition from the Renaissance to the Baroque.',
    slug: 'monteverdi',
    color: '#2563eb'
  },

  {
    name: 'Jean-Baptiste Lully',
    born: 1632,
    died: 1687,
    era: 'Baroque',
    period: 'Early',
    nationality: 'French',
    intro: 'The dominant composer of French court music under Louis XIV.',
    slug: 'lully',
    color: '#0891b2'
  },

  {
    name: 'Marc-Antoine Charpentier',
    born: 1643,
    died: 1704,
    era: 'Baroque',
    period: 'Early',
    nationality: 'French',
    intro: 'A prolific French composer known for sacred music, chamber music and theatrical works.',
    slug: 'charpentier',
    color: '#0d9488'
  },

  {
    name: 'Arcangelo Corelli',
    born: 1653,
    died: 1713,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'Italian',
    intro: 'An influential Italian violinist and composer who shaped the development of the concerto and sonata.',
    slug: 'corelli',
    color: '#059669'
  },

  {
    name: 'Henry Purcell',
    born: 1659,
    died: 1695,
    era: 'Baroque',
    period: 'Early',
    nationality: 'English',
    intro: 'One of England’s most important Baroque composers.',
    slug: 'purcell',
    color: '#16a34a'
  },

  {
    name: 'François Couperin',
    born: 1668,
    died: 1733,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'French',
    intro: 'A leading French composer and keyboardist of the late seventeenth and early eighteenth centuries.',
    slug: 'couperin',
    color: '#65a30d'
  },

  {
    name: 'Antonio Vivaldi',
    born: 1678,
    died: 1741,
    era: 'Baroque',
    period: 'Middle',
    nationality: 'Italian',
    intro: 'An Italian composer and violinist best known for his concertos, operas and sacred music.',
    slug: 'vivaldi',
    color: '#ca8a04'
  },

  {
    name: 'Georg Philipp Telemann',
    born: 1681,
    died: 1767,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'One of the most prolific composers of the late Baroque period.',
    slug: 'telemann',
    color: '#d97706'
  },

  {
    name: 'Jean-Philippe Rameau',
    born: 1683,
    died: 1764,
    era: 'Baroque',
    period: 'Late',
    nationality: 'French',
    intro: 'A major French composer and music theorist, particularly known for his operas and keyboard music.',
    slug: 'rameau',
    color: '#ea580c'
  },

  {
    name: 'Johann Sebastian Bach',
    born: 1685,
    died: 1750,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German',
    intro: 'One of the central figures of Western classical music and the late Baroque.',
    slug: 'bach',
    color: '#dc2626'
  },

  {
    name: 'George Frideric Handel',
    born: 1685,
    died: 1759,
    era: 'Baroque',
    period: 'Late',
    nationality: 'German-British',
    intro: 'A German-born composer who became one of the leading figures of English Baroque music.',
    slug: 'handel',
    color: '#e11d48'
  },

  {
    name: 'Christoph Willibald Gluck',
    born: 1714,
    died: 1787,
    era: 'Classical',
    period: 'Early',
    nationality: 'German',
    intro: 'A composer who played an important role in reforming eighteenth-century opera.',
    slug: 'gluck',
    color: '#db2777'
  },

  {
    name: 'Joseph Haydn',
    born: 1732,
    died: 1809,
    era: 'Classical',
    period: 'Middle',
    nationality: 'Austrian',
    intro: 'A central figure of the Classical period and a major developer of the symphony and string quartet.',
    slug: 'haydn',
    color: '#c026d3'
  },

  {
    name: 'Wolfgang Amadeus Mozart',
    born: 1756,
    died: 1791,
    era: 'Classical',
    period: 'Late',
    nationality: 'Austrian',
    intro: 'A prolific and influential composer whose works span opera, symphony, concerto and chamber music.',
    slug: 'mozart',
    color: '#9333ea'
  },

  {
    name: 'Ludwig van Beethoven',
    born: 1770,
    died: 1827,
    era: 'Classical',
    period: 'Late',
    nationality: 'German',
    intro: 'A pivotal composer whose music connects the Classical and Romantic eras.',
    slug: 'beethoven',
    color: '#7c3aed'
  },

  {
    name: 'Franz Schubert',
    born: 1797,
    died: 1828,
    era: 'Romantic',
    period: 'Early',
    nationality: 'Austrian',
    intro: 'A major early Romantic composer celebrated especially for his songs and chamber music.',
    slug: 'schubert',
    color: '#4f46e5'
  },

  {
    name: 'Johannes Brahms',
    born: 1833,
    died: 1897,
    era: 'Romantic',
    period: 'Late',
    nationality: 'German',
    intro: 'A major nineteenth-century composer whose music combines Romantic expression with Classical forms.',
    slug: 'brahms',
    color: '#4338ca'
  },

  {
    name: 'Antonín Dvořák',
    born: 1841,
    died: 1904,
    era: 'Romantic',
    period: 'Late',
    nationality: 'Czech',
    intro: 'A Czech composer known for symphonies, chamber music and works influenced by Czech musical traditions.',
    slug: 'dvorak',
    color: '#3730a3'
  },

  {
    name: 'Claude Debussy',
    born: 1862,
    died: 1918,
    era: 'Modern',
    period: 'Early',
    nationality: 'French',
    intro: 'A French composer whose music helped redefine harmony, timbre and musical form at the turn of the twentieth century.',
    slug: 'debussy',
    color: '#1d4ed8'
  },

  {
    name: 'Igor Stravinsky',
    born: 1882,
    died: 1971,
    era: 'Modern',
    period: 'Middle',
    nationality: 'Russian-French-American',
    intro: 'One of the most influential composers of the twentieth century, known for his constantly evolving musical language.',
    slug: 'stravinsky',
    color: '#0369a1'
  }
]


/* =========================
   Filters
   ========================= */

const selectedPeriod = ref<
    'All' | 'Early' | 'Middle' | 'Late'
>('All')

const selectedNationality = ref('All')


/* =========================
   Current era
   ========================= */

const eraComposers = computed(() => {
  if (!props.era) {
    return composers
  }

  return composers.filter(
      composer => composer.era === props.era
  )
})


/* =========================
   Nationality options
   ========================= */

const nationalities = computed(() => {
  const values = eraComposers.value.map(
      composer => composer.nationality
  )

  return [
    'All',
    ...Array.from(new Set(values))
  ]
})


/* =========================
   Filtered composers
   ========================= */

const filteredComposers = computed(() => {
  return eraComposers.value.filter(composer => {

    const periodMatch =
        selectedPeriod.value === 'All' ||
        composer.period === selectedPeriod.value

    const nationalityMatch =
        selectedNationality.value === 'All' ||
        composer.nationality === selectedNationality.value

    return (
        periodMatch &&
        nationalityMatch
    )
  })
})


/* =========================
   Pagination
   ========================= */

const currentPage = ref(1)

const pageSize = 4

const totalPages = computed(() => {
  return Math.ceil(
      filteredComposers.value.length /
      pageSize
  )
})

const paginatedComposers = computed(() => {

  const start =
      (currentPage.value - 1) *
      pageSize

  return filteredComposers.value.slice(
      start,
      start + pageSize
  )
})


/* =========================
   Filter actions
   ========================= */

function selectPeriod(
    period:
        | 'All'
        | 'Early'
        | 'Middle'
        | 'Late'
) {
  selectedPeriod.value = period
  currentPage.value = 1
}


function selectNationality(
    nationality: string
) {
  selectedNationality.value = nationality
  currentPage.value = 1
}


/* =========================
   Pagination actions
   ========================= */

function goToPage(page: number) {

  if (
      page < 1 ||
      page > totalPages.value
  ) {
    return
  }

  currentPage.value = page
}


/* =========================
   Composer page
   ========================= */

function goToComposer(
    composer: Composer
) {
  if (!composer.slug) {
    return
  }

  window.location.href =
      `/pages/composers/${composer.slug}`
}
</script>


<template>

  <div class="composer-list">


    <!-- =========================
         Filters
         ========================= -->

    <div class="filters">


      <!-- Period -->

      <div class="filter-group">

        <div class="filter-label">
          Period
        </div>

        <div class="filter-buttons">

          <button
              class="filter-button"
              :class="{
              active:
                selectedPeriod === 'All'
            }"
              @click="
              selectPeriod('All')
            "
          >
            All
          </button>


          <button
              class="filter-button"
              :class="{
              active:
                selectedPeriod === 'Early'
            }"
              @click="
              selectPeriod('Early')
            "
          >
            Early
          </button>


          <button
              class="filter-button"
              :class="{
              active:
                selectedPeriod === 'Middle'
            }"
              @click="
              selectPeriod('Middle')
            "
          >
            Middle
          </button>


          <button
              class="filter-button"
              :class="{
              active:
                selectedPeriod === 'Late'
            }"
              @click="
              selectPeriod('Late')
            "
          >
            Late
          </button>

        </div>

      </div>


      <!-- Nationality -->

      <div class="filter-group">

        <div class="filter-label">
          Nationality
        </div>

        <div class="filter-buttons">

          <button
              v-for="
              nationality in nationalities
            "
              :key="nationality"
              class="filter-button"
              :class="{
              active:
                selectedNationality ===
                nationality
            }"
              @click="
              selectNationality(
                nationality
              )
            "
          >
            {{ nationality }}
          </button>

        </div>

      </div>

    </div>


    <!-- =========================
         Result count
         ========================= -->

    <div class="result-info">

      {{ filteredComposers.length }}

      {{
        filteredComposers.length === 1
            ? 'composer'
            : 'composers'
      }}

    </div>


    <!-- =========================
         Composer cards
         ========================= -->

    <div
        v-if="
        filteredComposers.length > 0
      "
        class="composer-section"
    >

      <div class="composer-grid">

        <article
            v-for="
            composer in paginatedComposers
          "
            :key="composer.name"
            class="composer-card"
            :style="{
            '--composer-color':
              composer.color
          }"
            @click="
            goToComposer(composer)
          "
        >

          <!-- Color strip -->

          <div
              class="composer-color"
              :style="{
              backgroundColor:
                composer.color
            }"
          ></div>


          <!-- Content -->

          <div class="composer-content">

            <div class="composer-name">
              {{ composer.name }}
            </div>


            <div class="composer-dates">
              {{ composer.born }}–{{ composer.died }}
            </div>


            <div class="composer-meta">

              <span>
                {{ composer.nationality }}
              </span>

              <span>·</span>

              <span>
                {{ composer.period }}
              </span>

            </div>


            <p class="composer-intro">
              {{ composer.intro }}
            </p>


            <div
                v-if="composer.slug"
                class="composer-link"
            >
              View composer
              <span>→</span>
            </div>

          </div>

        </article>

      </div>


      <!-- =========================
           Pagination
           ========================= -->

      <div
          v-if="totalPages > 1"
          class="pagination"
      >

        <button
            class="page-button"
            :disabled="
            currentPage === 1
          "
            @click="
            goToPage(
              currentPage - 1
            )
          "
        >
          ‹
        </button>


        <button
            v-for="
            page in totalPages
          "
            :key="page"
            class="page-button"
            :class="{
            active:
              currentPage === page
          }"
            @click="
            goToPage(page)
          "
        >
          {{ page }}
        </button>


        <button
            class="page-button"
            :disabled="
            currentPage === totalPages
          "
            @click="
            goToPage(
              currentPage + 1
            )
          "
        >
          ›
        </button>

      </div>

    </div>


    <!-- =========================
         Empty
         ========================= -->

    <div
        v-else
        class="empty-state"
    >
      No composers match the selected
      filters.
    </div>


  </div>

</template>


<style scoped>

/* =========================
   Main
   ========================= */

.composer-list {
  width: 100%;
  margin: 24px 0 48px;
}


/* =========================
   Filters
   ========================= */

.filters {
  display: flex;
  flex-direction: column;

  gap: 12px;

  margin-bottom: 18px;
  padding: 16px;

  background: var(--vp-c-bg-soft);

  border: 1px solid
  var(--vp-c-divider);

  border-radius: 12px;

  text-align: left;
}


/* Filter row */

.filter-group {
  display: grid;

  grid-template-columns:
    100px minmax(0, 1fr);

  align-items: center;

  justify-items: start;

  column-gap: 14px;

  width: 100%;

  text-align: left;
}


/* Filter label */

.filter-label {
  width: 100px;

  font-size: 12px;

  font-weight: 600;

  line-height: 1.4;

  color: var(--vp-c-text-2);

  text-align: left;
}


/* Filter buttons */

.filter-buttons {
  display: flex;

  flex-wrap: wrap;

  align-items: center;

  justify-content: flex-start;

  gap: 7px;

  min-width: 0;

  width: 100%;

  text-align: left;
}


/* Filter button */

.filter-button {
  padding: 5px 11px;

  border: 1px solid
  var(--vp-c-divider);

  border-radius: 7px;

  background:
      var(--vp-c-bg);

  color:
      var(--vp-c-text-2);

  font-size: 12px;

  line-height: 1.4;

  cursor: pointer;

  transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
}


.filter-button:hover {
  border-color:
      var(--vp-c-brand-1);

  color:
      var(--vp-c-brand-1);
}


.filter-button.active {
  background:
      var(--vp-c-brand-1);

  border-color:
      var(--vp-c-brand-1);

  color: white;
}


/* =========================
   Result
   ========================= */

.result-info {
  margin-bottom: 14px;

  font-size: 12px;

  color: var(--vp-c-text-3);
}


/* =========================
   Composer section
   ========================= */

.composer-section {
  width: 100%;
}


/* =========================
   Composer grid
   ========================= */

.composer-grid {
  display: grid;

  grid-template-columns:
    repeat(
      2,
      minmax(0, 1fr)
    );

  gap: 16px;
}


/* =========================
   Composer card
   ========================= */

.composer-card {
  position: relative;

  display: flex;

  min-height: 180px;

  overflow: hidden;

  background:
      var(--vp-c-bg-soft);

  border: 1px solid
  var(--vp-c-divider);

  border-radius: 12px;

  cursor: pointer;

  transition:
      transform 0.2s ease,
      border-color 0.2s ease,
      box-shadow 0.2s ease;
}


.composer-card:hover {
  transform:
      translateY(-3px);

  border-color:
      var(--composer-color);

  box-shadow:
      0 8px 24px
      rgba(0, 0, 0, 0.08);
}


/* =========================
   Color strip
   ========================= */

.composer-color {
  flex: 0 0 7px;

  width: 7px;
}


/* =========================
   Composer content
   ========================= */

.composer-content {
  flex: 1;

  min-width: 0;

  padding: 20px 22px;
}


/* Name */

.composer-name {
  font-size: 18px;

  font-weight: 650;

  line-height: 1.35;

  color:
      var(--vp-c-text-1);
}


/* Dates */

.composer-dates {
  margin-top: 4px;

  font-size: 13px;

  color:
      var(--vp-c-text-2);
}


/* Meta */

.composer-meta {
  display: flex;

  gap: 7px;

  margin-top: 10px;

  font-size: 12px;

  color:
      var(--vp-c-text-2);
}


/* Intro */

.composer-intro {
  margin: 14px 0 0;

  font-size: 13px;

  line-height: 1.6;

  color:
      var(--vp-c-text-2);
}


/* Link */

.composer-link {
  margin-top: 14px;

  font-size: 13px;

  font-weight: 500;

  color:
      var(--vp-c-brand-1);
}


.composer-link span {
  display: inline-block;

  margin-left: 3px;

  transition:
      transform 0.2s ease;
}


.composer-card:hover
.composer-link span {
  transform:
      translateX(3px);
}


/* =========================
   Pagination
   ========================= */

.pagination {
  display: flex;

  justify-content: center;

  align-items: center;

  gap: 6px;

  margin-top: 24px;
}


.page-button {
  display: flex;

  align-items: center;

  justify-content: center;

  min-width: 32px;

  height: 32px;

  padding: 0 9px;

  border: 1px solid
  var(--vp-c-divider);

  border-radius: 7px;

  background:
      var(--vp-c-bg);

  color:
      var(--vp-c-text-2);

  font-size: 12px;

  line-height: 1;

  cursor: pointer;

  transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease;
}


.page-button:hover:not(:disabled) {
  border-color:
      var(--vp-c-brand-1);

  color:
      var(--vp-c-brand-1);
}


.page-button.active {
  background:
      var(--vp-c-brand-1);

  border-color:
      var(--vp-c-brand-1);

  color: white;
}


.page-button:disabled {
  opacity: 0.35;

  cursor: default;
}


/* =========================
   Empty state
   ========================= */

.empty-state {
  padding: 48px 20px;

  text-align: center;

  font-size: 13px;

  color:
      var(--vp-c-text-3);

  border: 1px dashed
  var(--vp-c-divider);

  border-radius: 12px;
}


/* =========================
   Mobile
   ========================= */

@media (max-width: 760px) {

  .composer-grid {
    grid-template-columns: 1fr;
  }

  .filter-group {
    grid-template-columns: 1fr;

    row-gap: 7px;
  }

  .filter-label {
    width: auto;
  }

}

</style>