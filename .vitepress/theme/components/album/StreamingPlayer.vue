<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import {
  type Album,
  firstAvailableService,
  streamingEmbedSrc,
  type StreamingService,
  streamingServices,
  streamingUrl
} from '../../data/albums'

const props = defineProps<{
  album: Album
}>()

const active = ref<StreamingService | null>(
    firstAvailableService(props.album)
)

watch(
    () => props.album.id,
    () => {
      active.value = firstAvailableService(props.album)
    }
)

const available = computed(() =>
    streamingServices.map(service => {
      const url = streamingUrl(props.album, service.id)

      return {
        ...service,
        url,
        enabled: Boolean(url)
      }
    })
)

const current = computed(() =>
    available.value.find(service => service.id === active.value) ?? null
)

const embedSrc = computed(() => {
  if (!current.value?.url) {
    return null
  }

  return streamingEmbedSrc(
      current.value.id,
      current.value.url
  )
})

function selectService(service: StreamingService) {
  const option = available.value.find(
      item => item.id === service
  )

  if (!option?.enabled) {
    return
  }

  active.value = service
}
</script>

<template>
  <div class="streaming-player">

    <div
        v-if="current?.url"
        class="streaming-panel"
    >
      <div
          v-if="embedSrc"
          class="streaming-frame"
      >
        <iframe
            :key="embedSrc"
            :src="embedSrc"
            :title="`${current.label} player`"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            referrerpolicy="strict-origin-when-cross-origin"
        />
      </div>

      <p
          v-else
          class="streaming-unavailable"
      >
        Embedded player is not available for this
        {{ current.label }} link.
      </p>

      <a
          class="streaming-external"
          :href="current.url"
          target="_blank"
          rel="noopener noreferrer"
      >
        Open in {{ current.label }} ↗
      </a>
    </div>

    <p
        v-else
        class="streaming-unavailable"
    >
      No streaming links are available for this album.
    </p>

    <div
        class="streaming-tabs"
        role="tablist"
        aria-label="Streaming services"
    >
      <!-- 这里保持你原来的 tabs -->
    <!-- Streaming service tabs -->
    <div
        class="streaming-tabs"
        role="tablist"
        aria-label="Streaming services"
    >

      <button
          v-for="service in available"
          :key="service.id"
          type="button"
          role="tab"
          :aria-selected="active === service.id"
          :disabled="!service.enabled"
          :title="
          service.enabled
            ? service.label
            : `${service.label} unavailable`
        "
          :class="[
          `service-${service.id}`,
          {
            active: active === service.id
          }
        ]"
          @click="selectService(service.id)"
      >

        <span
            class="service-icon"
            aria-hidden="true"
        >

          <!-- Spotify -->
          <svg
              v-if="service.id === 'spotify'"
              viewBox="0 0 24 24"
          >
            <circle
                cx="12"
                cy="12"
                r="10"
                fill="currentColor"
            />

            <path
                d="M7.2 9.2c3.5-1 7.1-.7 9.8.7"
                fill="none"
                stroke="white"
                stroke-width="1.6"
                stroke-linecap="round"
            />

            <path
                d="M7.8 12.2c2.8-.7 5.7-.4 8 .8"
                fill="none"
                stroke="white"
                stroke-width="1.5"
                stroke-linecap="round"
            />

            <path
                d="M8.5 15c2-.4 4.1-.1 5.8.7"
                fill="none"
                stroke="white"
                stroke-width="1.4"
                stroke-linecap="round"
            />
          </svg>


          <!-- Apple Music -->
          <svg
              v-else-if="service.id === 'apple_music'"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              >
             <path
                 fill="currentColor"
                 d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z"/>
          </svg>


          <!-- TIDAL -->
          <svg
              v-else-if="service.id === 'tidal'"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
          >
             <path
               fill="currentColor"
               d="M12.012 3.992L8.008 7.996 4.004 3.992 0 7.996 4.004 12l4.004-4.004L12.012 12l-4.004 4.004 4.004 4.004 4.004-4.004L12.012 12l4.004-4.004-4.004-4.004zM16.042 7.996l3.979-3.979L24 7.996l-3.979 3.979z"
          />
          </svg>


          <!-- Fallback -->
          <span
              v-else
              class="service-fallback"
          >
            {{ service.label.charAt(0) }}
          </span>

        </span>
      </button>

    </div>

    </div>
  </div>
</template>

<style scoped>

.streaming-player {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}


/* =========================
   Streaming tabs
   ========================= */

.streaming-tabs {
  display: flex;
  width: 100%;
  min-width: 0;
  overflow: hidden;

  background: var(--vp-c-bg-soft);
}

.streaming-tabs button {
  flex: 1 1 0;
  min-width: 0;
  height: 48px;
  padding: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 0;
  background: transparent;

  color: var(--vp-c-text-3);
  cursor: pointer;
  transition:
      color .18s ease,
      background .18s ease;
}


/* =========================
   Icons
   ========================= */

.service-icon {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 24px;
  height: 24px;
}

.service-icon svg {
  display: block;

  width: 22px;
  height: 22px;
}


/* =========================
   Hover
   ========================= */

.streaming-tabs button:hover:not(:disabled) {
  background: var(--vp-c-bg-mute);
}



.streaming-tabs button:disabled {
  opacity: 0.25;
  cursor: not-allowed;
}


/* =========================
   Player
   ========================= */

.streaming-panel {
  min-width: 0;
}

.streaming-frame {
  width: 100%;
  height: 420px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.streaming-frame iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 0;
}


/* =========================
   External link
   ========================= */

.streaming-external {
  display: inline-block;

  margin-top: 10px;

  font-size: 15px;
  font-weight: 500;
}


/* =========================
   Empty / unavailable
   ========================= */

.streaming-unavailable {
  margin: 0;

  font-size: 13px;

  color: var(--vp-c-text-3);
}


/* =========================
   Fallback icon
   ========================= */

.service-fallback {
  font-size: 14px;
  font-weight: 700;
}

</style>
