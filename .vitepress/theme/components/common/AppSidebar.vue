<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vitepress'

const route = useRoute()

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle'): void
}>()

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = typeof window !== 'undefined' && window.innerWidth < 768
}

const navItems = computed(() => [
  { label: 'Home', icon: 'home', href: '/' },
  { label: 'Composer', icon: 'user', href: '/pages/composers' },
  { label: 'Catalogues', icon: 'collection', href: '/catalogues?tab=RV' },
  { label: 'Albums', icon: 'picture', href: '/pages/albums' }
])

const isActive = (href: string) => {
  if (href === '/') return route.path === '/' || route.path === '/index.html'
  return route.path.startsWith(href)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open && isMobile.value) {
    emit('toggle')
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <aside
    class="app-sidebar"
    :class="{
      'app-sidebar--open': open,
      'app-sidebar--closed': !open,
      'app-sidebar--mobile': isMobile
    }"
    aria-label="Main navigation"
  >
    <div v-if="isMobile && open" class="app-sidebar__overlay" @click="emit('toggle')" />
    
    <div class="app-sidebar__header">
      <button
        type="button"
        class="app-sidebar__toggle"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-label="open ? 'Collapse sidebar' : 'Expand sidebar'"
        @click="emit('toggle')"
      >
            <svg v-if="open" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
              <path fill="currentColor" d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32z"></path>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
              <path fill="currentColor" d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32z"></path>
            </svg>
      </button>
    </div>

    <nav class="app-sidebar__nav" aria-label="Sidebar navigation">
      <a
        v-for="item in navItems"
        :key="item.href"
        :href="item.href"
        class="app-sidebar__link"
        :class="{
          'app-sidebar__link--active': isActive(item.href)
        }"
        :title="item.label"
        @click="isMobile && emit('toggle')"
      >
        <span class="app-sidebar__icon-wrapper">
          <span class="app-sidebar__icon">
            <svg v-if="item.icon === 'home'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <svg v-else-if="item.icon === 'user'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <svg v-else-if="item.icon === 'collection'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <svg v-else-if="item.icon === 'picture'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </span>
        </span>
        <span class="app-sidebar__text">{{ item.label }}</span>
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  z-index: 50;
  width: 240px;
  background: var(--md-surface);
  border-right: 1px solid var(--md-outline-variant);
  display: flex;
  flex-direction: column;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1),
              width 200ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.app-sidebar--closed {
  width: 64px;
}

.app-sidebar__header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px;
  min-height: 56px;
}

.app-sidebar__toggle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  transition: all 120ms ease;
}

.app-sidebar__toggle:hover {
  background: var(--md-surface-container-high);
  border-color: var(--md-outline-variant);
  color: var(--md-on-surface);
}

.app-sidebar__toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

.app-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 10px 10px;
  overflow-y: auto;
  overflow-x: hidden;
}

.app-sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--md-radius-md);
  color: var(--md-on-surface-variant);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  transition: background 120ms ease, color 120ms ease;
  border: 1px solid transparent;
}

.app-sidebar__link:hover {
  background: var(--md-surface-container-high);
  color: var(--md-on-surface);
}

.app-sidebar__link--active {
  background: color-mix(in srgb, var(--md-primary) 12%, transparent);
  color: var(--md-primary);
  border-color: color-mix(in srgb, var(--md-primary) 20%, transparent);
}

.app-sidebar__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary) 40%, transparent);
}

.app-sidebar__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.app-sidebar__icon svg {
  display: block;
}

.app-sidebar__icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 100%;
}

.app-sidebar__text {
  flex: 1;
  min-width: 0;
  transition: opacity 150ms ease;
}

.app-sidebar--closed .app-sidebar__text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

.app-sidebar--closed .app-sidebar__link {
  justify-content: center;
  padding: 10px;
  gap: 0;
}

.app-sidebar--closed .app-sidebar__toggle {
  margin: 0 auto;
}

/* Mobile */
@media (max-width: 767px) {
  .app-sidebar {
    width: 280px;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
  }

  .app-sidebar--open {
    transform: translateX(0);
  }

  .app-sidebar--closed {
    transform: translateX(-100%);
    width: 280px;
  }

  .app-sidebar__text {
    opacity: 1;
    width: auto;
  }

  .app-sidebar__link {
    justify-content: flex-start;
    padding: 10px 12px;
  }

  .app-sidebar--closed .app-sidebar__link {
    justify-content: flex-start;
    padding: 10px 12px;
  }

  .app-sidebar--closed .app-sidebar__toggle {
    margin: 0;
  }

  .app-sidebar__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: -1;
    opacity: 1;
  }
}

/* Overlay for mobile */
@media (min-width: 768px) {
  .app-sidebar__overlay {
    display: none;
  }
}
</style>
