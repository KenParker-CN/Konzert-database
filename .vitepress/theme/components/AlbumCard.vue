<script setup lang="ts">
import type { Album } from '../data/albums'

defineProps<{ album: Album }>()

const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <article
    class="album-card"
    role="button"
    tabindex="0"
    :aria-label="`Open ${album.title || 'album'}`"
    @click="emit('open')"
    @keydown.enter.prevent="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <div class="album-cover">
      <img v-if="album.cover" :src="album.cover" :alt="album.title" loading="lazy">
      <div v-else class="cover-placeholder"><span>{{ album.title || 'Album' }}</span></div>
      <div class="album-overlay" aria-hidden="true"><span>View recording</span><span class="album-arrow">↗</span></div>
    </div>
    <div class="album-caption">
      <div class="album-title">{{ album.title }}</div>
      <div v-if="album.composer.length" class="album-composer">{{ album.composer.join(' · ') }}</div>
    </div>
  </article>
</template>

<style scoped>
.album-card { min-width: 0; cursor: pointer; color: inherit; outline: none; }
.album-cover { position: relative; aspect-ratio: 1; overflow: hidden; background: var(--vp-c-bg-soft); box-shadow: 0 1px 0 var(--archive-rule); }
.album-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 350ms cubic-bezier(.2,.7,.2,1), filter 350ms ease; }
.album-overlay { position: absolute; inset: 0; display: flex; align-items: flex-end; justify-content: space-between; padding: .75rem; background: linear-gradient(to top, rgba(20,18,15,.72), transparent 58%); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; opacity: 0; transition: opacity 180ms ease; }
.album-arrow { font-size: 1.15rem; }
.album-caption { padding: .7rem .1rem .2rem; }
.album-title { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; color: var(--archive-ink); font-family: var(--archive-serif); font-size: 1.25rem; line-height: 1.03; }
.album-composer { overflow: hidden; margin-top: .35rem; color: var(--vp-c-text-3); font-size: 11px; letter-spacing: .04em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
.album-card:hover .album-cover img, .album-card:focus-visible .album-cover img { transform: scale(1.045); filter: saturate(.88) contrast(1.04); }
.album-card:hover .album-overlay, .album-card:focus-visible .album-overlay { opacity: 1; }
.album-card:focus-visible .album-cover { outline: 2px solid var(--archive-oxide); outline-offset: 3px; }
.cover-placeholder { display: grid; place-items: center; width: 100%; height: 100%; padding: 1rem; color: var(--vp-c-text-2); font-family: var(--archive-serif); font-size: 1.3rem; text-align: center; }
@media (hover: none) { .album-overlay { opacity: 1; background: linear-gradient(to top, rgba(20,18,15,.62), transparent 55%); } }
</style>
