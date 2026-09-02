<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

interface Props {
  page: string
  lang?: string
}

const props = withDefaults(defineProps<Props>(), {
  lang: 'en'
})

const intro = ref('')
const loading = ref(true)
const error = ref(false)

let abortController: AbortController | null = null
let timeoutId: number | null = null

async function loadWikipedia() {
  // 取消上一次请求
  abortController?.abort()

  if (timeoutId !== null) {
    window.clearTimeout(timeoutId)
    timeoutId = null
  }

  // 没有页面名称时直接结束
  if (!props.page.trim()) {
    intro.value = ''
    loading.value = false
    error.value = false
    return
  }

  loading.value = true
  error.value = false
  intro.value = ''

  const controller = new AbortController()
  abortController = controller

  timeoutId = window.setTimeout(() => {
    controller.abort()
  }, 5000)

  try {
    const url =
        `https://${props.lang}.wikipedia.org/api/rest_v1/page/summary/` +
        encodeURIComponent(props.page)

    const response = await fetch(url, {
      signal: controller.signal
    })

    if (!response.ok) {
      throw new Error(`Wikipedia request failed: ${response.status}`)
    }

    const data = await response.json()

    if (!data.extract) {
      throw new Error('No summary found')
    }

    intro.value = data.extract
  } catch (err) {
    // AbortError 也统一显示为加载失败
    console.error('Wikipedia:', err)
    error.value = true
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId)
      timeoutId = null
    }

    if (abortController === controller) {
      abortController = null
    }

    loading.value = false
  }
}

// 只在 page 或 lang 改变时重新加载
watch(
    () => [props.page, props.lang],
    () => {
      if (typeof window !== 'undefined') {
        loadWikipedia()
      }
    }
)

// 只在浏览器端挂载之后请求 Wikipedia
onMounted(() => {
  loadWikipedia()
})

// 组件销毁时取消请求
onUnmounted(() => {
  abortController?.abort()

  if (timeoutId !== null) {
    window.clearTimeout(timeoutId)
    timeoutId = null
  }
})
</script>

<template>
  <section class="wikipedia-intro">

    <!-- Loading -->
    <div
        v-if="loading"
        class="wiki-loading"
    >
      Loading from Wikipedia…
    </div>

    <!-- Error -->
    <div
        v-else-if="error"
        class="wiki-error"
    >
      Unable to load the Wikipedia introduction.
    </div>

    <!-- Content -->
    <div
        v-else-if="intro"
        class="wiki-content"
    >
      <p class="wiki-text">
        {{ intro }}
      </p>

      <a
          class="wiki-source"
          :href="
          `https://${props.lang}.wikipedia.org/wiki/` +
          encodeURIComponent(props.page)
        "
          target="_blank"
          rel="noopener noreferrer"
      >
        Wikipedia
        <span>↗</span>
      </a>
    </div>

  </section>
</template>

<style scoped>
.wikipedia-intro {
  margin: 24px 0;
}

/* =========================
   Content
   ========================= */

.wiki-content {
  padding: 18px 20px;

  border-left: 3px solid
  var(--vp-c-brand-1);

  background:
      var(--vp-c-bg-soft);
}

/* =========================
   Text
   ========================= */

.wiki-text {
  margin: 0;

  font-size: 14px;

  line-height: 1.8;

  color:
      var(--vp-c-text-1);
}

/* =========================
   Source
   ========================= */

.wiki-source {
  display: inline-flex;

  align-items: center;

  gap: 4px;

  margin-top: 12px;

  font-size: 12px;

  color:
      var(--vp-c-brand-1);

  text-decoration: none;
}

.wiki-source:hover {
  text-decoration: underline;
}

.wiki-source span {
  font-size: 11px;
}

/* =========================
   Loading
   ========================= */

.wiki-loading {
  padding: 18px 20px;

  font-size: 13px;

  color:
      var(--vp-c-text-3);

  background:
      var(--vp-c-bg-soft);

  border-left: 3px solid
  var(--vp-c-divider);
}

/* =========================
   Error
   ========================= */

.wiki-error {
  padding: 18px 20px;

  font-size: 13px;

  color:
      var(--vp-c-text-2);

  background:
      var(--vp-c-bg-soft);

  border-left: 3px solid
  var(--vp-c-divider);
}
</style>