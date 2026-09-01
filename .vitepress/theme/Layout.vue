<script setup lang="ts">
import { ref } from 'vue'
import DefaultTheme from 'vitepress/theme'
import LocalPlayer from './components/LocalPlayer.vue'

const playerOpen = ref(false)
const playerLocked = ref(false)

function openPlayer() {
  playerOpen.value = true
}

function closePlayer() {
  if (!playerLocked.value) {
    playerOpen.value = false
  }
}

function togglePlayer() {
  playerLocked.value = !playerLocked.value
  playerOpen.value = true
}
</script>

<template>
  <DefaultTheme.Layout>

    <template #layout-bottom>
      <footer class="site-footer">
        <a href="/">Home</a>
        <a href="/pages/composers">Composers</a>
        <a href="/catalogues?tab=RV">Catalogues</a>
        <a href="/pages/albums">Collections</a>
        <a href="/pages/earlymusic">Early Music</a>
      </footer>
    </template>

    <template #nav-bar-content-after>
      <div
          class="player-nav"
          @mouseenter="openPlayer"
          @mouseleave="closePlayer"
      >
        <button
            class="player-toggle"
            :class="{ active: playerOpen }"
            @click="togglePlayer"
        >
          <span aria-hidden="true">♫</span><span class="player-toggle-label">Player</span>
        </button>

        <div
            class="player-popover"
            :class="{ hidden: !playerOpen }"
        >
          <LocalPlayer />
        </div>
      </div>
    </template>

  </DefaultTheme.Layout>
</template>

<style>
.player-nav {
  position: relative;

  display: flex;
  align-items: center;

  height: 100%;
}

.player-toggle {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  padding: 0 .45rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background var(--archive-ease), color var(--archive-ease), transform var(--archive-ease);
}

.player-toggle:hover,
.player-toggle.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  transform: translateY(-1px);
}

.player-toggle-label { margin-left: .35rem; font-size: 10px; }

.player-popover {
  position: absolute;

  top: calc(100% + 10px);
  right: 0;

  width: 360px;

  z-index: 9999;
}

.player-popover.hidden {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
}

.site-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  padding: 28px 24px 36px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 13px;
}

.site-footer a {
  color: var(--vp-c-text-2);
  text-decoration: none;
}

.site-footer a:hover {
  color: var(--vp-c-brand-1);
}
</style>
