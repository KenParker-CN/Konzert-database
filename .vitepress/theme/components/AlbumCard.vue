<script setup lang="ts">
import type { Album } from '../data/albums'

defineProps<{
  album: Album
}>()

const emit = defineEmits<{
  open: []
}>()
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
      <img
          v-if="album.cover"
          :src="album.cover"
          :alt="album.title"
          loading="lazy"
      >

      <div v-else class="cover-placeholder">
        <span>{{ album.title || 'Album' }}</span>
      </div>

      <div class="album-overlay">
        <div class="album-overlay-title">
          {{ album.title }}
        </div>

        <div class="album-overlay-info" aria-hidden="true">
          <span>i</span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.album-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  cursor: pointer;
  border: 0;
  border-radius: 10px;
  background: transparent;
  transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
}

.album-card:hover,
.album-card:focus-visible {
  transform: translateY(-3px);
  outline: none;
}

.album-cover {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  overflow: hidden;
}

.album-cover img {
  display: block;
  margin: auto;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.album-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 14px;
  box-sizing: border-box;

  background: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.78) 0%,
      rgba(0, 0, 0, 0.35) 35%,
      rgba(0, 0, 0, 0) 70%
  );

  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.album-card:hover .album-overlay,
.album-card:focus-visible .album-overlay {
  opacity: 1;
}

.album-overlay-title {
  min-width: 0;
  max-width: calc(100% - 42px);

  color: #fff;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.album-overlay-info {
  flex: 0 0 auto;

  display: flex;
  align-items: center;
  justify-content: center;

  width: 30px;
  height: 30px;

  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 50%;

  background: rgba(0, 0, 0, 0.25);
  color: #fff;

  backdrop-filter: blur(4px);
}

.album-overlay-info span {
  font-family: Georgia, serif;
  font-size: 17px;
  font-weight: 700;
  font-style: italic;
  line-height: 1;
}

.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  text-align: center;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.album-info {
  min-width: 0;
  padding: 9px 2px 4px;
}

.album-title {
  overflow: hidden;
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
