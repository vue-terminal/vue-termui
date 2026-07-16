<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import SessionPlayer from '@vue-termui/docs/player'
import { type Cast, parseCast } from '@vue-termui/docs/cast'
import { resizeCast, serializeCast, trimCast } from './cast-edit'

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

// --- Editing -------------------------------------------------------------
// The original, unedited cast for the current recording. Bundled recordings
// only carry a `src` URL, so fetch + parse them here (dropped ones are already
// parsed). Everything the editor produces is derived from this base.
const baseCast = ref<Cast | null>(null)

const trimStart = ref(0)
const trimEnd = ref(0)
const width = ref(80)
const height = ref(24)

watch(
  current,
  async (rec) => {
    baseCast.value = null
    if (!rec) return
    if (rec.cast) {
      baseCast.value = rec.cast
      return
    }
    try {
      const res = await fetch(rec.src!)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      baseCast.value = parseCast(await res.text())
    } catch (err) {
      error.value = `Couldn't load ${rec.name}: ${err instanceof Error ? err.message : String(err)}`
    }
  },
  { immediate: true },
)

// Reset the edit controls to the full range / native grid whenever the base
// recording changes.
watch(baseCast, (cast) => {
  if (!cast) return
  trimStart.value = 0
  trimEnd.value = cast.duration
  width.value = cast.header.width || 80
  height.value = cast.header.height || 24
})

// The live, edited cast fed to the player: trim first (rebases time), then apply
// the grid. Recomputes on every control change, and the player picks it up.
const editedCast = computed<Cast | null>(() => {
  const cast = baseCast.value
  if (!cast) return null
  return resizeCast(
    trimCast(cast, trimStart.value, trimEnd.value),
    Math.max(1, width.value),
    Math.max(1, height.value),
  )
})

const trimmedDuration = computed(() => Math.max(0, trimEnd.value - trimStart.value))

function formatSeconds(seconds: number): string {
  return `${seconds.toFixed(2)}s`
}

function onTrimStart(value: number): void {
  trimStart.value = Math.min(value, trimEnd.value)
}

function onTrimEnd(value: number): void {
  trimEnd.value = Math.max(value, trimStart.value)
}

function resetEdits(): void {
  const cast = baseCast.value
  if (!cast) return
  trimStart.value = 0
  trimEnd.value = cast.duration
  width.value = cast.header.width || 80
  height.value = cast.header.height || 24
}

const isEdited = computed(() => {
  const cast = baseCast.value
  if (!cast) return false
  return (
    trimStart.value !== 0 ||
    trimEnd.value !== cast.duration ||
    width.value !== (cast.header.width || 80) ||
    height.value !== (cast.header.height || 24)
  )
})

function download(): void {
  if (!editedCast.value) return
  const text = serializeCast(editedCast.value)
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${current.value?.name ?? 'session'}-edited.cast`
  a.click()
  URL.revokeObjectURL(url)
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

      <SessionPlayer v-if="current && editedCast" :key="current.id" :cast="editedCast" />

      <section v-if="baseCast" class="editor">
        <div class="editor-row">
          <label class="field trim">
            <span class="field-label">Trim start</span>
            <input
              type="range"
              min="0"
              :max="baseCast.duration"
              step="0.01"
              :value="trimStart"
              @input="onTrimStart(Number(($event.target as HTMLInputElement).value))"
            />
            <output>{{ formatSeconds(trimStart) }}</output>
          </label>

          <label class="field trim">
            <span class="field-label">Trim end</span>
            <input
              type="range"
              min="0"
              :max="baseCast.duration"
              step="0.01"
              :value="trimEnd"
              @input="onTrimEnd(Number(($event.target as HTMLInputElement).value))"
            />
            <output>{{ formatSeconds(trimEnd) }}</output>
          </label>
        </div>

        <div class="editor-row">
          <label class="field">
            <span class="field-label">Width</span>
            <input v-model.number="width" type="number" min="1" max="500" />
          </label>
          <label class="field">
            <span class="field-label">Height</span>
            <input v-model.number="height" type="number" min="1" max="200" />
          </label>

          <span class="summary">
            {{ width }}×{{ height }} · {{ formatSeconds(trimmedDuration) }}
          </span>

          <span class="spacer" />

          <button class="editor-btn" type="button" :disabled="!isEdited" @click="resetEdits">
            Reset
          </button>
          <button class="editor-btn primary" type="button" @click="download">Save .cast</button>
        </div>
      </section>
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

.editor {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding: 0.9rem 1rem;
  background: #0e121b;
  border: 1px solid #1c2230;
  border-radius: 8px;
}

.editor-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #cdd3de;
}

.field.trim {
  flex: 1 1 260px;
}

.field-label {
  flex-shrink: 0;
  color: #9aa0aa;
}

.field.trim input[type='range'] {
  flex: 1 1 auto;
  min-width: 0;
  accent-color: #59c2ff;
  cursor: pointer;
}

.field output {
  flex-shrink: 0;
  min-width: 3.5rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.field input[type='number'] {
  width: 4.5rem;
  padding: 0.25rem 0.4rem;
  color: #e6e6e6;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 5px;
}

.summary {
  font-size: 0.8rem;
  color: #9aa0aa;
  font-variant-numeric: tabular-nums;
}

.spacer {
  flex: 1 1 auto;
}

.editor-btn {
  padding: 0.35rem 0.8rem;
  color: #cdd3de;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 6px;
  cursor: pointer;
}

.editor-btn:hover:not(:disabled) {
  background: #1c2230;
}

.editor-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.editor-btn.primary {
  color: #0b0e14;
  background: #59c2ff;
  border-color: #59c2ff;
}

.editor-btn.primary:hover {
  background: #7fd0ff;
}
</style>
