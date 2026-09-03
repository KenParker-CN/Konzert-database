<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElIcon } from 'element-plus'
import DefaultTheme from 'vitepress/theme'
import ThemeSelector from './components/common/ThemeSelector.vue'
import AppSidebar from './components/common/AppSidebar.vue'

const sidebarOpen = ref(true)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  document.documentElement.classList.toggle('sidebar-collapsed', !sidebarOpen.value)
}

function handleToggleSidebar() {
  toggleSidebar()
}

onMounted(() => {
  const stored = localStorage.getItem('sidebar-open')
  if (stored !== null) {
    sidebarOpen.value = stored === 'true'
  }
  document.documentElement.classList.toggle('sidebar-collapsed', !sidebarOpen.value)
})

watch(sidebarOpen, (val) => {
  localStorage.setItem('sidebar-open', String(val))
  document.documentElement.classList.toggle('sidebar-collapsed', !val)
})

function adjustComposerTitle() {
  const html = document.documentElement
  if (!html.classList.contains('composer-page')) return
  const h1 = document.querySelector('.composer-page .VPDoc h1')
  if (!h1) return

  h1.style.fontSize = ''

  if (h1.scrollWidth > h1.clientWidth) {
    let size = parseFloat(getComputedStyle(h1).fontSize)
    const minSize = 14
    while (size > minSize && h1.scrollWidth > h1.clientWidth) {
      size -= 0.5
      h1.style.fontSize = `${size}px`
    }
  }
}

function updateComposerClass() {
  const path = typeof window !== 'undefined' ? window.location.pathname : ''
  document.documentElement.classList.toggle('composer-page', path.startsWith('/pages/composers/'))
}

let resizeObserver: ResizeObserver | null = null

function setupTitleObserver() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  const h1 = document.querySelector('.composer-page .VPDoc h1')
  if (!h1) return
  resizeObserver = new ResizeObserver(() => {
    adjustComposerTitle()
  })
  resizeObserver.observe(h1)
}

function onRouteChange() {
  updateComposerClass()
  setupTitleObserver()
}

onMounted(() => {
  updateComposerClass()
  setupTitleObserver()
  window.addEventListener('popstate', onRouteChange)
  const originalPushState = history.pushState
  history.pushState = function (this: History, ...args: any[]) {
    originalPushState.apply(this, args)
    onRouteChange()
  }
  const originalReplaceState = history.replaceState
  history.replaceState = function (this: History, ...args: any[]) {
    originalReplaceState.apply(this, args)
    onRouteChange()
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', onRouteChange)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar :open="sidebarOpen" @toggle="handleToggleSidebar" />
    <div class="app-layout__main">
      <DefaultTheme.Layout>
        <template #nav-bar-content-after>
          <button
              type="button"
              class="sidebar-toggle"
              :aria-expanded="sidebarOpen ? 'true' : 'false'"
              aria-label="Toggle sidebar"
              @click="handleToggleSidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20" fill="currentColor">
              <path d="M160 448a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V160.064a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32V416a32 32 0 0 1-32 32zM160 896a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32zm448 0a32 32 0 0 1-32-32V608a32 32 0 0 1 32-32h255.936a32 32 0 0 1 32 32v256a32 32 0 0 1-32 32z"></path>
            </svg>
          </button>
          <ThemeSelector />
        </template>

        <template #nav-screen-content-after>
          <ThemeSelector />
        </template>

                    <template #layout-bottom>
          <footer class="site-footer">
            <a href="/">Home</a>
            <a href="/pages/composers">Composers</a>
            <a href="/catalogues?tab=RV">Catalogues</a>
            <a href="/pages/albums">Collections</a>
            <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
          </footer>
        </template>
      </DefaultTheme.Layout>
    </div>
  </div>
</template>

<style>
/* ---- Sidebar toggle button ---- */
.sidebar-toggle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--md-outline-variant, var(--vp-c-divider));
  border-radius: var(--md-radius-full);
  background: transparent;
  color: var(--md-on-surface-variant, var(--vp-c-text-2));
  cursor: pointer;
  transition: background var(--md-duration-fast, 120ms) var(--md-ease, ease),
              border-color var(--md-duration-fast, 120ms) var(--md-ease, ease),
              color var(--md-duration-fast, 120ms) var(--md-ease, ease);
}

.sidebar-toggle:hover {
  border-color: var(--md-primary, var(--vp-c-brand-1));
  color: var(--md-primary, var(--vp-c-brand-1));
}

.sidebar-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--md-primary, var(--vp-c-brand-1)) 40%, transparent);
}

/* ---- App layout ---- */
.app-layout {
  display: flex;
  min-height: 100vh;
}

.app-layout__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  transition: margin 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 767px) {
  .app-layout__main {
    margin-left: 0 !important;
  }
}

/* ---- Footer ---- */
.site-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 18px;
  padding: 28px 24px 36px;
  border-top: 1px solid var(--md-outline-variant);
  font-size: 13px;
}

.site-footer a {
  color: var(--md-on-surface-variant);
  text-decoration: none;
}

.site-footer a:hover {
  color: var(--md-primary);
}

/* ---- Responsive: show toggle on mobile ---- */
@media (max-width: 768px) {
  .sidebar-toggle {
    display: grid;
  }
}
</style>