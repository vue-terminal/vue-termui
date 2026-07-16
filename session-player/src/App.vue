<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import SessionPlayer from '@vue-termui/docs/player'
import { type Cast, parseCast } from '@vue-termui/docs/cast'

interface Recording {
  id: string
  name: string
  // Bundled recordings pass a URL the player fetches lazily; dropped files are
  // already parsed in memory.
  src?: string
  cast?: Cast
  local?: boolean
}

// Auto-discover every recorded session bundled under src/casts. Each .cast is
// produced by the asciinema recorder (session-player/scripts/record.sh). Using
// `?url` keeps them out of the bundle — the player fetches each one on demand.
const modules = import.meta.glob('./casts/*.cast', {
  query: '?url',
  import: 'default',
  eager: true,
})

const bundled: Recording[] = Object.entries(modules)
  .map(([path, url]) => {
    const name = path
      .split('/')
      .pop()!
      .replace(/\.cast$/, '')
    return { id: name, name, src: url as string }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// Casts the user opens from disk at runtime.
const loaded = ref<Recording[]>([])
const recordings = computed(() => [...bundled, ...loaded.value])

const selected = ref(bundled[0]?.id ?? '')
const current = computed(() => recordings.value.find((r) => r.id === selected.value))

const error = ref('')
const dragging = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
let localCount = 0

async function loadFiles(files: FileList | File[] | null): Promise<void> {
  error.value = ''
  await Promise.all(
    Array.from(files ?? []).map(async (file) => {
      try {
        const cast = parseCast(await file.text())
        const name = file.name.replace(/\.cast$/, '')
        const id = `local-${localCount++}`
        loaded.value.push({ id, name, cast, local: true })
        selected.value = id
      } catch (err) {
        error.value = `Couldn't load ${file.name}: ${err instanceof Error ? err.message : String(err)}`
      }
    }),
  )
}

function onPick(event: Event): void {
  loadFiles((event.target as HTMLInputElement).files)
  // Reset so picking the same file again re-triggers change.
  ;(event.target as HTMLInputElement).value = ''
}

function onDrop(event: DragEvent): void {
  dragging.value = false
  loadFiles(event.dataTransfer?.files ?? null)
}
</script>

<template>
  <main
    class="app"
    :class="{ dragging }"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <header class="header">
      <div>
        <h1>vue-termui · session player</h1>
        <p class="subtitle">Recorded terminal sessions, replayed in the browser with xterm.js</p>
      </div>
      <button class="load" type="button" @click="fileInput?.click()">Open .cast…</button>
      <input
        ref="fileInput"
        type="file"
        accept=".cast,.json,.txt"
        multiple
        hidden
        @change="onPick"
      />
    </header>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="recordings.length > 0">
      <nav class="tabs">
        <button
          v-for="r in recordings"
          :key="r.id"
          class="tab"
          :class="{ active: r.id === selected }"
          type="button"
          @click="selected = r.id"
        >
          {{ r.name }}<span v-if="r.local" class="badge">local</span>
        </button>
      </nav>

      <SessionPlayer v-if="current" :key="current.id" :src="current.src" :cast="current.cast" />
    </template>

    <section v-else class="empty">
      <p>
        No recordings yet. Drop a <code>.cast</code> file here, click <b>Open .cast…</b>, or record
        one:
      </p>
      <pre><code>session-player/scripts/record.sh styled-text /text-styles</code></pre>
    </section>

    <div v-if="dragging" class="dropzone">Drop .cast file to play</div>
  </main>
</template>

<style scoped>
.app {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: #e6e6e6;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
}

.subtitle {
  margin: 0.35rem 0 0;
  color: #9aa0aa;
  font-size: 0.9rem;
}

.load {
  flex-shrink: 0;
  padding: 0.45rem 0.9rem;
  color: #cdd3de;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 6px;
  cursor: pointer;
}

.load:hover {
  background: #1c2230;
}

.error {
  padding: 0.6rem 0.9rem;
  color: #ffb4b4;
  background: #2a1518;
  border: 1px solid #5a2a2f;
  border-radius: 6px;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  color: #cdd3de;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 6px;
  cursor: pointer;
}

.tab.active {
  color: #0b0e14;
  background: #59c2ff;
  border-color: #59c2ff;
}

.badge {
  padding: 0.05rem 0.35rem;
  font-size: 0.7rem;
  border-radius: 999px;
  background: #2a3142;
  color: #9aa0aa;
}

.tab.active .badge {
  background: rgba(11, 14, 20, 0.25);
  color: #0b0e14;
}

.empty {
  color: #9aa0aa;
  line-height: 1.6;
}

.empty pre {
  padding: 0.75rem 1rem;
  overflow: auto;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 6px;
  color: #cdd3de;
}

.app.dragging {
  outline: 2px dashed #59c2ff;
  outline-offset: -8px;
  border-radius: 12px;
}

.dropzone {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: #59c2ff;
  background: rgba(11, 14, 20, 0.7);
  border-radius: 12px;
  pointer-events: none;
}
</style>
