<script setup lang="ts">
import { computed, ref } from 'vue'
import { composerLink, composers } from '../../data/composers'

const props = defineProps<{
  era?: string
}>()



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

        <component
            :is="composer.slug ? 'a' : 'article'"
            v-for="
            composer in paginatedComposers
          "
            :key="composer.name"
            class="composer-card"
            :href="composer.slug ? composerLink(composer) : undefined"
            :style="{
            '--composer-color':
              composer.color
          }"
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

        </component>

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
  text-decoration: none;
  color: inherit;

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