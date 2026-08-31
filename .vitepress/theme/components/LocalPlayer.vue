<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  ref
} from 'vue'

interface Track {
  id: string
  file: File
  url: string
  name: string
}

const playlist = ref<Track[]>([])
const currentIndex = ref(-1)

const audio = ref<HTMLAudioElement | null>(null)

const isPlaying = ref(false)

const currentTime = ref(0)
const duration = ref(0)

const volume = ref(0.8)

const loopMode = ref<'all' | 'one' | 'none'>('all')

const currentTrack = computed(() => {
  return playlist.value[currentIndex.value] ?? null
})


/* =========================
   Add music
   ========================= */

function selectMusic(event: Event) {
  const input = event.target as HTMLInputElement

  if (!input.files?.length) return

  const files = Array.from(input.files)

  const newTracks: Track[] = files.map(
      (file, index) => ({
        id: `${Date.now()}-${index}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
        name: file.name
      })
  )

  const wasEmpty = playlist.value.length === 0

  playlist.value.push(...newTracks)

  if (wasEmpty) {
    currentIndex.value = 0
    loadTrack(0, false)
  }

  input.value = ''
}


/* =========================
   Load track
   ========================= */

function loadTrack(
    index: number,
    autoplay = false
) {
  const track = playlist.value[index]

  if (!track) return

  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }

  currentIndex.value = index

  currentTime.value = 0
  duration.value = 0

  const player = new Audio(track.url)

  audio.value = player

  player.volume = volume.value

  player.addEventListener(
      'loadedmetadata',
      () => {
        duration.value = player.duration
      }
  )

  player.addEventListener(
      'timeupdate',
      () => {
        currentTime.value = player.currentTime
      }
  )

  player.addEventListener(
      'ended',
      handleEnded
  )

  if (autoplay) {
    player
        .play()
        .then(() => {
          isPlaying.value = true
        })
        .catch(() => {
          isPlaying.value = false
        })
  }
}


/* =========================
   Play / Pause
   ========================= */

function togglePlay() {
  if (!playlist.value.length) return

  if (!audio.value) {
    loadTrack(
        currentIndex.value >= 0
            ? currentIndex.value
            : 0,
        true
    )

    return
  }

  if (audio.value.paused) {
    audio.value
        .play()
        .then(() => {
          isPlaying.value = true
        })
        .catch(() => {
          isPlaying.value = false
        })
  } else {
    audio.value.pause()
    isPlaying.value = false
  }
}


/* =========================
   Previous
   ========================= */

function previousTrack() {
  if (!playlist.value.length) return

  if (
      audio.value &&
      audio.value.currentTime > 3
  ) {
    audio.value.currentTime = 0
    return
  }

  let index = currentIndex.value - 1

  if (index < 0) {
    index = playlist.value.length - 1
  }

  loadTrack(index, true)
}


/* =========================
   Next
   ========================= */

function nextTrack() {
  if (!playlist.value.length) return

  if (loopMode.value === 'one') {
    loadTrack(currentIndex.value, true)
    return
  }

  if (
      currentIndex.value <
      playlist.value.length - 1
  ) {
    loadTrack(
        currentIndex.value + 1,
        true
    )

    return
  }

  if (loopMode.value === 'all') {
    loadTrack(0, true)
    return
  }

  isPlaying.value = false

  if (audio.value) {
    audio.value.currentTime = 0
  }

  currentTime.value = 0
}


/* =========================
   Ended
   ========================= */

function handleEnded() {
  nextTrack()
}


/* =========================
   Seek
   ========================= */

function seek(event: Event) {
  if (!audio.value) return

  const input = event.target as HTMLInputElement

  const time = Number(input.value)

  audio.value.currentTime = time

  currentTime.value = time
}


/* =========================
   Volume
   ========================= */

function changeVolume(event: Event) {
  const input = event.target as HTMLInputElement

  const value = Number(input.value)

  volume.value = value

  if (audio.value) {
    audio.value.volume = value
  }
}


/* =========================
   Loop
   ========================= */

function toggleLoop() {
  if (loopMode.value === 'all') {
    loopMode.value = 'one'
  } else if (loopMode.value === 'one') {
    loopMode.value = 'none'
  } else {
    loopMode.value = 'all'
  }
}


/* =========================
   Select playlist track
   ========================= */

function selectTrack(index: number) {
  loadTrack(index, true)
}


/* =========================
   Remove track
   ========================= */

function removeTrack(index: number) {
  const track = playlist.value[index]

  if (!track) return

  const wasCurrent =
      index === currentIndex.value

  URL.revokeObjectURL(track.url)

  playlist.value.splice(index, 1)

  if (!playlist.value.length) {
    stopPlayer()

    currentIndex.value = -1

    return
  }

  if (index < currentIndex.value) {
    currentIndex.value--

    return
  }

  if (wasCurrent) {
    const newIndex = Math.min(
        index,
        playlist.value.length - 1
    )

    loadTrack(newIndex, true)
  }
}


/* =========================
   Clear playlist
   ========================= */

function clearPlaylist() {
  playlist.value.forEach(track => {
    URL.revokeObjectURL(track.url)
  })

  playlist.value = []

  stopPlayer()

  currentIndex.value = -1
}


/* =========================
   Stop
   ========================= */

function stopPlayer() {
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
    audio.value = null
  }

  isPlaying.value = false

  currentTime.value = 0
  duration.value = 0
}


/* =========================
   Format time
   ========================= */

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)

  const secondsPart =
      Math.floor(seconds % 60)

  return `${minutes}:${secondsPart
      .toString()
      .padStart(2, '0')}`
}


/* =========================
   Cleanup
   ========================= */

onBeforeUnmount(() => {
  if (audio.value) {
    audio.value.pause()
    audio.value.src = ''
  }

  playlist.value.forEach(track => {
    URL.revokeObjectURL(track.url)
  })
})
</script>


<template>
  <div class="local-player">

    <!-- =====================
         Current player
         ===================== -->

    <div class="player-main">

      <!-- 当前歌曲 -->

      <div class="track-info">

        <div class="track-name">
          {{
            currentTrack
                ? currentTrack.name
                : 'No music selected'
          }}
        </div>

        <div class="track-time">
          {{ formatTime(currentTime) }}
          /
          {{ formatTime(duration) }}
        </div>

      </div>


      <!-- 控制 -->

      <div class="controls">

        <button
            class="control-button"
            :disabled="!playlist.length"
            @click="previousTrack"
        >
          ‹
        </button>

        <button
            class="control-button play-button"
            :disabled="!playlist.length"
            @click="togglePlay"
        >
          {{ isPlaying ? 'Ⅱ' : '▶' }}
        </button>

        <button
            class="control-button"
            :disabled="!playlist.length"
            @click="nextTrack"
        >
          ›
        </button>

      </div>

    </div>


    <!-- =====================
         Progress
         ===================== -->

    <div class="progress-row">

      <input
          class="progress"
          type="range"
          min="0"
          :max="duration || 0"
          step="0.1"
          :value="currentTime"
          :disabled="!audio"
          @input="seek"
      />

    </div>


    <!-- =====================
         Options
         ===================== -->

    <div class="options">

      <button
          class="loop-button"
          :class="{
          active: loopMode !== 'none'
        }"
          @click="toggleLoop"
          title="Loop mode"
      >
        {{
          loopMode === 'one'
              ? '↻ 1'
              : loopMode === 'all'
                  ? '↻'
                  : '→'
        }}
      </button>


      <div class="volume">

        <span>🔊</span>

        <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="volume"
            @input="changeVolume"
        />

      </div>


      <label class="add-button">

        + Add music

        <input
            type="file"
            accept="audio/*"
            multiple
            @change="selectMusic"
        />

      </label>


      <button
          v-if="playlist.length"
          class="clear-button"
          @click="clearPlaylist"
      >
        Clear
      </button>

    </div>


    <!-- =====================
         Playlist
         ===================== -->

    <div
        v-if="playlist.length"
        class="playlist"
    >

      <div class="playlist-header">
        Playlist · {{ playlist.length }}
      </div>


      <div
          v-for="(track, index) in playlist"
          :key="track.id"
          class="playlist-item"
          :class="{
          active:
            index === currentIndex
        }"
          @click="selectTrack(index)"
      >

        <div class="track-number">
          {{
            String(index + 1)
                .padStart(2, '0')
          }}
        </div>

        <div class="track-play">
          {{
            index === currentIndex &&
            isPlaying
                ? 'Ⅱ'
                : '▶'
          }}
        </div>

        <div class="playlist-name">
          {{ track.name }}
        </div>

        <button
            class="remove-button"
            @click.stop="removeTrack(index)"
        >
          ×
        </button>

      </div>

    </div>

  </div>
</template>


<style scoped>
.local-player {
  width: 360px;

  overflow: hidden;

  border: 1px solid var(--vp-c-divider);

  border-radius: 10px;

  background: var(--vp-c-bg);

  box-shadow:
      0 10px 30px
      rgba(0, 0, 0, 0.12);

  backdrop-filter: blur(14px);
}


/* =========================
   Main
   ========================= */

.player-main {
  padding: 13px 14px 8px;
}


/* =========================
   Track info
   ========================= */

.track-info {
  min-width: 0;

  margin-bottom: 10px;
}

.track-name {
  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  font-size: 12px;
  font-weight: 500;
}

.track-time {
  margin-top: 3px;

  font-size: 10px;

  color: var(--vp-c-text-3);
}


/* =========================
   Controls
   ========================= */

.controls {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 10px;
}

.control-button {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  border: 1px solid var(--vp-c-divider);

  border-radius: 50%;

  background: transparent;

  color: var(--vp-c-text-2);

  cursor: pointer;
}

.control-button:hover {
  border-color: var(--vp-c-brand-1);

  color: var(--vp-c-brand-1);
}

.control-button:disabled {
  opacity: 0.35;

  cursor: default;
}

.play-button {
  background: var(--vp-c-brand-1);

  border-color: var(--vp-c-brand-1);

  color: white;
}

.play-button:hover {
  color: white;
}


/* =========================
   Progress
   ========================= */

.progress-row {
  padding: 0 14px 9px;
}

.progress {
  display: block;

  width: 100%;

  height: 4px;

  margin: 0;
}


/* =========================
   Options
   ========================= */

.options {
  display: flex;
  align-items: center;

  gap: 6px;

  padding: 0 14px 11px;
}

.loop-button,
.add-button,
.clear-button {
  padding: 5px 8px;

  border: 1px solid var(--vp-c-divider);

  border-radius: 6px;

  background: transparent;

  color: var(--vp-c-text-2);

  font-size: 10px;

  cursor: pointer;
}

.loop-button:hover,
.add-button:hover,
.clear-button:hover {
  border-color: var(--vp-c-brand-1);

  color: var(--vp-c-brand-1);
}

.loop-button.active {
  border-color: var(--vp-c-brand-1);

  color: var(--vp-c-brand-1);
}

.add-button input {
  display: none;
}


/* =========================
   Volume
   ========================= */

.volume {
  display: flex;
  align-items: center;

  gap: 5px;

  margin-left: auto;

  font-size: 10px;
}

.volume input {
  width: 55px;
}


/* =========================
   Playlist
   ========================= */

.playlist {
  max-height: 170px;

  overflow-y: auto;

  border-top: 1px solid var(--vp-c-divider);
}

.playlist-header {
  padding: 7px 14px;

  font-size: 10px;

  font-weight: 600;

  color: var(--vp-c-text-3);
}

.playlist-item {
  display: flex;
  align-items: center;

  gap: 8px;

  padding: 6px 14px;

  cursor: pointer;
}

.playlist-item:hover {
  background: var(--vp-c-bg-soft);
}

.playlist-item.active {
  background: var(--vp-c-bg-soft);
}

.track-number {
  width: 20px;

  font-size: 9px;

  color: var(--vp-c-text-3);
}

.track-play {
  width: 15px;

  font-size: 9px;

  color: var(--vp-c-text-3);
}

.playlist-item.active .track-play {
  color: var(--vp-c-brand-1);
}

.playlist-name {
  flex: 1;

  min-width: 0;

  overflow: hidden;

  white-space: nowrap;

  text-overflow: ellipsis;

  font-size: 10px;
}

.remove-button {
  width: 20px;
  height: 20px;

  padding: 0;

  border: 0;

  background: transparent;

  color: var(--vp-c-text-3);

  font-size: 15px;

  cursor: pointer;

  opacity: 0;
}

.playlist-item:hover .remove-button {
  opacity: 1;
}

.remove-button:hover {
  color: var(--vp-c-danger-1);
}


/* =========================
   Mobile
   ========================= */

@media (max-width: 700px) {
  .local-player {
    width: 100%;
  }

  .volume {
    display: none;
  }
}
</style>