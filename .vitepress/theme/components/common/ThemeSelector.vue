<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Moon, Monitor, Sunny } from '@element-plus/icons-vue'
import {
  SEED_PRESETS,
  type AppearanceMode,
  getAppearance,
  getResolvedTheme,
  getSeedId,
  initTheme,
  seedPreviewColor,
  setAppearance,
  setSeed
} from '../../theme'

const open = ref(false)
const appearance = ref<AppearanceMode>('system')
const resolvedDark = ref(false)
const seedId = ref('blue')
const seedColors = ref<Record<string, string>>({})

async function seedColor(id: string): Promise<string> {
  if (!seedColors.value[id]) {
    seedColors.value = {
      ...seedColors.value,
      [id]: await seedPreviewColor(id)
    }
  }
  return seedColors.value[id]
}

async function syncFromStore() {
  appearance.value = getAppearance()
  seedId.value = getSeedId()
  resolvedDark.value = getResolvedTheme() === 'dark'
  await Promise.all(SEED_PRESETS.map(p => seedColor(p.id)))
}

function toggleOpen() {
  open.value = !open.value
}

function pickAppearance(mode: AppearanceMode) {
  appearance.value = mode
  resolvedDark.value = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  setAppearance(mode).catch(() => {})
}

function pickSeed(id: string) {
  seedId.value = id
  setSeed(id).catch(() => {})
}

const triggerIcon = computed(() => (resolvedDark.value ? Moon : Sunny))

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node
  if (!panel.value?.contains(target) && !trigger.value?.contains(target)) {
    open.value = false
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    open.value = false
  }
}

const panel = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)

onMounted(() => {
  // material-color-utilities 动态 import 失败时静默降级：
  // CSS 内的 fallback token（var(--md-*, var(--vp-c-*))）保证 UI 仍可渲染。
  syncFromStore().catch(() => {})
  initTheme().catch(() => {})
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="theme-selector">
    <button
        ref="trigger"
        type="button"
        class="theme-trigger"
        aria-label="Theme settings"
        aria-haspopup="true"
        :aria-expanded="open ? 'true' : 'false'"
        @click="toggleOpen"
    >
      <span class="theme-trigger-icon" aria-hidden="true">
        <el-icon :size="18">
          <Moon v-if="resolvedDark" />
          <Sunny v-else />
        </el-icon>
      </span>
    </button>

    <Transition name="theme-pop">
      <div ref="panel" v-if="open" class="theme-panel" role="menu">
        <div class="theme-section">
          <div class="theme-section-label">Appearance</div>
          <div class="theme-segmented" role="radiogroup" aria-label="Appearance">
            <button
                v-for="mode in (['light', 'dark', 'system'] as const)"
                :key="mode"
                type="button"
                role="radio"
                :aria-checked="appearance === mode"
                :class="{ active: appearance === mode }"
                class="theme-seg-item"
                @click="pickAppearance(mode)"
            >
              <el-icon class="seg-icon">
                <Sunny v-if="mode === 'light'" />
                <Moon v-else-if="mode === 'dark'" />
                <Monitor v-else />
              </el-icon>
              {{ mode[0].toUpperCase() + mode.slice(1) }}
            </button>
          </div>
        </div>

        <div class="theme-section">
          <div class="theme-section-label">Theme color</div>
          <div class="theme-seeds" role="radiogroup" aria-label="Seed color">
            <button
                v-for="preset in SEED_PRESETS"
                :key="preset.id"
                type="button"
                role="radio"
                :aria-checked="seedId === preset.id"
                :aria-label="preset.label"
                :title="preset.label"
                :style="{ backgroundColor: seedColors[preset.id] || preset.seed }"
                :class="{ active: seedId === preset.id }"
                class="theme-seed-dot"
                @click="pickSeed(preset.id)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.theme-selector {
  position: relative;
  display: flex;
  align-items: center;
}

.theme-trigger {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--md-outline-variant, var(--vp-c-divider));
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant, var(--vp-c-text-2));
  cursor: pointer;
  transition:
      background var(--md-duration-fast, 120ms) var(--md-ease, ease),
      border-color var(--md-duration-fast, 120ms) var(--md-ease, ease),
      color var(--md-duration-fast, 120ms) var(--md-ease, ease);
}

.theme-trigger:hover {
  border-color: var(--md-outline, var(--vp-c-brand-1));
  color: var(--md-primary, var(--vp-c-brand-1));
}

.theme-trigger-icon {
  display: flex;
  width: 18px;
  height: 18px;
}

.theme-trigger-icon svg {
  width: 100%;
  height: 100%;
}

.theme-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 100;
  width: 248px;
  padding: 16px;
  background: var(--md-surface-container-high, var(--vp-c-bg-elv));
  border: 1px solid var(--md-outline-variant, var(--vp-c-divider));
  border-radius: var(--md-radius-md);
  box-shadow: var(--md-shadow-3, 0 8px 24px rgba(0, 0, 0, .14));
}

.theme-section + .theme-section {
  margin-top: 16px;
}

.theme-section-label {
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .01em;
  color: var(--md-on-surface-variant, var(--vp-c-text-2));
}

.theme-segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 3px;
  background: var(--md-surface-container, var(--vp-c-bg-soft));
  border-radius: var(--md-radius-full);
}

.theme-seg-item {
  padding: 6px 8px;
  border: 0;
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant, var(--vp-c-text-2));
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition:
      background var(--md-duration-fast, 120ms) var(--md-ease, ease),
      color var(--md-duration-fast, 120ms) var(--md-ease, ease);
}

.theme-seg-item.active {
  background: var(--md-secondary-container, var(--vp-c-bg-elv));
  color: var(--md-on-secondary-container, var(--vp-c-text-1));
}

.theme-seeds {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.theme-seed-dot {
  width: 26px;
  height: 26px;
  border: 2px solid transparent;
  border-radius: var(--md-radius-full);
  cursor: pointer;
  transition:
      transform var(--md-duration-fast, 120ms) var(--md-ease, ease),
      box-shadow var(--md-duration-fast, 120ms) var(--md-ease, ease);
}

.theme-seed-dot:hover {
  transform: scale(1.1);
}

.theme-seed-dot.active {
  box-shadow: 0 0 0 2px var(--md-surface-container-high, var(--vp-c-bg-elv)),
      0 0 0 4px var(--md-primary, var(--vp-c-brand-1));
}

/* pop animation (Transition 类挂在 v-if 节点上，scoped 下需 :global) */
:global(.theme-pop-enter-active),
:global(.theme-pop-leave-active) {
  transition: opacity var(--md-duration-fast, 120ms) var(--md-ease, ease),
      transform var(--md-duration-fast, 120ms) var(--md-ease, ease);
}

:global(.theme-pop-enter-from),
:global(.theme-pop-leave-to) {
  opacity: 0;
  transform: translateY(-4px);
}
</style>