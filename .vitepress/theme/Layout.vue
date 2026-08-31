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
          ♫
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
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-left: 4px;
  padding: 0;

  border: 0;
  border-radius: 8px;

  background: transparent;

  color: var(--vp-c-text-2);

  font-size: 18px;

  cursor: pointer;

  transition:
      background 0.15s ease,
      color 0.15s ease;
}

.player-toggle:hover,
.player-toggle.active {
  background: var(--vp-c-default-soft);
  color: var(--vp-c-brand-1);
}

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
</style>