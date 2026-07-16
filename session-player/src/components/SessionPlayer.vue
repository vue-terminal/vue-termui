<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import { Terminal } from '@xterm/xterm'
import { WebglAddon } from '@xterm/addon-webgl'
import { CanvasAddon } from '@xterm/addon-canvas'
import type { Cast } from '@/player/cast'

const { cast } = defineProps<{ cast: Cast }>()

const mount = useTemplateRef<HTMLDivElement>('mount')
const viewport = useTemplateRef<HTMLDivElement>('viewport')

const playing = ref(false)
const elapsed = ref(0)
const speed = ref(1)
const speeds = [0.5, 1, 2, 4]
// A clean app exit clears the alternate screen, so the last recorded frame is
// blank; looping keeps the demo on its content instead of dwelling there.
const loop = ref(true)

let term: Terminal | undefined
// Number of events already written to the terminal — xterm is a stateful VT
// parser, so playback is just replaying output events in order. Seeking backward
// means resetting the terminal and replaying from zero.
let writtenIndex = 0
let rafId = 0
let anchorWall = 0
let anchorElapsed = 0

// The cast is a fixed grid, so rather than scroll on small screens (or CSS-stretch
// and blur the blocks), we shrink the font to fit narrow containers. We never
// grow past the native size — the terminal just centers with room to spare on
// wide screens. Font metrics are linear in size, so we measure the grid's natural
// width once at the base size and derive the fit from it.
const BASE_FONT_SIZE = 14
let baseWidth = 0
let resizeObserver: ResizeObserver | undefined

// Grabs the character grid's pixel width (`.xterm-screen`), which is the fixed
// cols × cell size — not xterm's full-width root element. Retries until the
// renderer has laid out, then does the first fit.
function measureAndFit(attempt = 0): void {
  const screen = term?.element?.querySelector<HTMLElement>('.xterm-screen')
  baseWidth = screen?.offsetWidth ?? 0
  if (baseWidth <= 0 && attempt < 5) {
    requestAnimationFrame(() => measureAndFit(attempt + 1))
    return
  }
  fit()
}

function fit(): void {
  if (!term || !viewport.value || baseWidth <= 0) return
  const available = viewport.value.clientWidth
  if (available <= 0) return
  // Only ever shrink to fit — cap at the native size so it never upscales.
  const size = Math.min(BASE_FONT_SIZE, Math.max(5, (BASE_FONT_SIZE * available) / baseWidth))
  if (Math.abs(size - (term.options.fontSize ?? BASE_FONT_SIZE)) > 0.1) {
    term.options.fontSize = size
  }
}

const progress = computed(() =>
  cast.duration > 0 ? Math.min(elapsed.value / cast.duration, 1) : 0,
)

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function writeUpTo(target: number): void {
  const events = cast.events
  while (writtenIndex < events.length && events[writtenIndex]!.time <= target) {
    term!.write(events[writtenIndex]!.data)
    writtenIndex++
  }
}

function frame(): void {
  const now = performance.now()
  elapsed.value = anchorElapsed + ((now - anchorWall) / 1000) * speed.value
  writeUpTo(elapsed.value)

  if (writtenIndex >= cast.events.length) {
    elapsed.value = cast.duration
    if (loop.value) {
      restart()
      rafId = requestAnimationFrame(frame)
      return
    }
    playing.value = false
    return
  }
  if (playing.value) rafId = requestAnimationFrame(frame)
}

function play(): void {
  if (playing.value || !term) return
  // Replaying after the end starts over from the beginning.
  if (writtenIndex >= cast.events.length) restart()
  playing.value = true
  anchorWall = performance.now()
  anchorElapsed = elapsed.value
  rafId = requestAnimationFrame(frame)
}

function pause(): void {
  playing.value = false
  if (rafId) cancelAnimationFrame(rafId)
}

function toggle(): void {
  if (playing.value) pause()
  else play()
}

function restart(): void {
  term?.reset()
  writtenIndex = 0
  elapsed.value = 0
  anchorWall = performance.now()
  anchorElapsed = 0
}

function seek(target: number): void {
  if (!term) return
  const clamped = Math.max(0, Math.min(target, cast.duration))
  // Rewinding can't be undone incrementally; reset and replay from the start.
  if (clamped < elapsed.value) {
    term.reset()
    writtenIndex = 0
  }
  writeUpTo(clamped)
  elapsed.value = clamped
  anchorWall = performance.now()
  anchorElapsed = clamped
}

function onScrub(event: Event): void {
  const wasPlaying = playing.value
  pause()
  seek(Number((event.target as HTMLInputElement).value))
  if (wasPlaying) play()
}

// Move to a state where exactly `n` events have been written. A frame is one
// output event; stepping back replays from the start (xterm is stateful).
function goToIndex(n: number): void {
  if (!term) return
  const target = Math.max(0, Math.min(n, cast.events.length))
  if (target < writtenIndex) {
    term.reset()
    writtenIndex = 0
  }
  while (writtenIndex < target) {
    term.write(cast.events[writtenIndex]!.data)
    writtenIndex++
  }
  elapsed.value = writtenIndex > 0 ? cast.events[writtenIndex - 1]!.time : 0
  anchorWall = performance.now()
  anchorElapsed = elapsed.value
}

function stepForward(): void {
  pause()
  goToIndex(writtenIndex + 1)
}

function stepBack(): void {
  pause()
  goToIndex(writtenIndex - 1)
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    stepForward()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    stepBack()
  } else if (event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}

const fontFamily = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

onMounted(async () => {
  // xterm measures glyph width when it opens, so wait for the webfont to load
  // first — otherwise it measures the fallback and every cell is misaligned.
  if (document.fonts?.load) await document.fonts.load('14px "JetBrains Mono"')
  // The component may have unmounted while awaiting the font.
  if (!mount.value) return

  term = new Terminal({
    // Fall back to a sane grid when a cast was recorded without a real terminal
    // size (e.g. asciinema under a sizeless pty reports 0), else xterm opens blank.
    cols: cast.header.width > 0 ? cast.header.width : 80,
    rows: cast.header.height > 0 ? cast.header.height : 24,
    fontSize: BASE_FONT_SIZE,
    fontFamily,
    cursorBlink: false,
    // Playback only — the terminal never reads input.
    disableStdin: true,
    // Required by the WebGL renderer addon.
    allowProposedApi: true,
    theme: { background: '#0b0e14', foreground: '#bfbdb6' },
  })
  term.open(mount.value!)

  // The default DOM renderer draws box-drawing and block-element glyphs (▀ ▄ █,
  // quadrants…) from the font, which leaves seams between cells — very visible on
  // OpenTUI's half-block image/3D output. The WebGL/Canvas renderers draw those
  // glyphs procedurally so they tile seamlessly (like Ghostty). Prefer WebGL,
  // fall back to Canvas, then the DOM renderer.
  try {
    const webgl = new WebglAddon()
    webgl.onContextLoss(() => webgl.dispose())
    term.loadAddon(webgl)
  } catch {
    try {
      term.loadAddon(new CanvasAddon())
    } catch {
      // DOM renderer — glyphs come from the font.
    }
  }

  // Measure the grid's natural width at the base font size (once the renderer has
  // laid out), then fit and keep fitting as the container resizes.
  measureAndFit()
  resizeObserver = new ResizeObserver(() => fit())
  if (viewport.value) resizeObserver.observe(viewport.value)

  play()
})

onBeforeUnmount(() => {
  pause()
  resizeObserver?.disconnect()
  term?.dispose()
})
</script>

<template>
  <div class="session-player" tabindex="0" @keydown="onKeydown">
    <div ref="viewport" class="viewport">
      <div ref="mount" class="terminal" />
    </div>

    <div class="controls">
      <button class="btn" type="button" title="Restart" @click="restart">⏮</button>
      <button class="btn" type="button" title="Step back one frame (←)" @click="stepBack">◁</button>
      <button
        class="btn"
        type="button"
        :title="playing ? 'Pause (space)' : 'Play (space)'"
        @click="toggle"
      >
        {{ playing ? '⏸' : '▶' }}
      </button>
      <button class="btn" type="button" title="Step forward one frame (→)" @click="stepForward">
        ▷
      </button>
      <button
        class="btn"
        :class="{ active: loop }"
        type="button"
        title="Loop"
        @click="loop = !loop"
      >
        ⟳
      </button>

      <input
        class="scrubber"
        type="range"
        min="0"
        :max="cast.duration"
        step="0.01"
        :value="elapsed"
        @input="onScrub"
      />

      <span class="time">{{ formatTime(elapsed) }} / {{ formatTime(cast.duration) }}</span>

      <select v-model.number="speed" class="speed" title="Playback speed">
        <option v-for="s in speeds" :key="s" :value="s">{{ s }}×</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.session-player {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  box-sizing: border-box;
  padding: 0.75rem;
  background: #0b0e14;
  border: 1px solid #1c2230;
  border-radius: 8px;
}

.session-player:focus-visible {
  outline: none;
  border-color: #2a3142;
}

/* Full-width measured box; the terminal centers inside it and is clipped rather
   than allowed to scroll horizontally. */
.viewport {
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

/* The terminal is a fixed grid (e.g. 80 cols); fit() shrinks the font on narrow
   screens but never grows past the native size. Sized to content, not stretched. */
.terminal {
  flex: none;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  color: #bfbdb6;
  font:
    13px/1 'JetBrains Mono',
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
}

.btn {
  min-width: 2rem;
  padding: 0.25rem 0.5rem;
  color: #bfbdb6;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 5px;
  cursor: pointer;
}

.btn:hover {
  background: #1c2230;
}

.btn.active {
  color: #0b0e14;
  background: #59c2ff;
  border-color: #59c2ff;
}

.scrubber {
  flex: 1 1 120px;
  min-width: 0;
  accent-color: #59c2ff;
  cursor: pointer;
}

.time {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.speed {
  color: #bfbdb6;
  background: #131721;
  border: 1px solid #2a3142;
  border-radius: 5px;
  padding: 0.2rem 0.35rem;
}
</style>
