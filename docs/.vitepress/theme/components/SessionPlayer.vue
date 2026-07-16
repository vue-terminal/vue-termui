<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { Terminal } from '@xterm/xterm'
import { WebglAddon } from '@xterm/addon-webgl'
import { CanvasAddon } from '@xterm/addon-canvas'
// Self-contained styles + font so the component is drop-in anywhere (docs, app).
import '@xterm/xterm/css/xterm.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import { type Cast, parseCast } from './cast'

// Pass a parsed `cast`, or a `src` URL that is fetched lazily when the player
// scrolls into view (so casts aren't loaded until needed).
const props = defineProps<{ cast?: Cast; src?: string }>()

const root = useTemplateRef<HTMLDivElement>('root')
const mount = useTemplateRef<HTMLDivElement>('mount')
const viewport = useTemplateRef<HTMLDivElement>('viewport')

const castData = shallowRef<Cast | null>(props.cast ?? null)
const loadError = ref('')

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
let started = false
let resizeObserver: ResizeObserver | undefined
let visibilityObserver: IntersectionObserver | undefined
let themeObserver: MutationObserver | undefined

// The cast is a fixed grid, so rather than scroll on small screens (or CSS-stretch
// and blur the blocks), we shrink the font to fit narrow containers. We never grow
// past the native size. Font metrics are linear in size, so we measure a single
// column's width once at the base size — a font constant — and derive the grid's
// natural width as `cols × cellWidthBase`. Deriving it (instead of re-measuring the
// DOM) keeps the fit correct when the grid changes: the terminal's font is usually
// mid-shrink, so a fresh measurement would read the shrunken width and overshoot.
const BASE_FONT_SIZE = 14
let cellWidthBase = 0

const duration = computed(() => castData.value?.duration ?? 0)
const progress = computed(() =>
  duration.value > 0 ? Math.min(elapsed.value / duration.value, 1) : 0,
)

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function writeUpTo(target: number): void {
  const events = castData.value!.events
  while (writtenIndex < events.length && events[writtenIndex]!.time <= target) {
    term!.write(events[writtenIndex]!.data)
    writtenIndex++
  }
}

function frame(): void {
  const events = castData.value!.events
  const now = performance.now()
  elapsed.value = anchorElapsed + ((now - anchorWall) / 1000) * speed.value
  writeUpTo(elapsed.value)

  if (writtenIndex >= events.length) {
    elapsed.value = duration.value
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
  if (playing.value || !term || !castData.value) return
  // Replaying after the end starts over from the beginning.
  if (writtenIndex >= castData.value.events.length) restart()
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
  if (!term || !castData.value) return
  const clamped = Math.max(0, Math.min(target, duration.value))
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
  if (!term || !castData.value) return
  const events = castData.value.events
  const target = Math.max(0, Math.min(n, events.length))
  if (target < writtenIndex) {
    term.reset()
    writtenIndex = 0
  }
  while (writtenIndex < target) {
    term.write(events[writtenIndex]!.data)
    writtenIndex++
  }
  elapsed.value = writtenIndex > 0 ? events[writtenIndex - 1]!.time : 0
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

function cols(): number {
  const w = castData.value?.header.width ?? 0
  return w > 0 ? w : 80
}

// Learn the per-column pixel width from `.xterm-screen` (the fixed cols × cell
// grid, not xterm's full-width root). Must run while the font is at its base size,
// so it's called once at startup before any fit() shrinks it. Retries until the
// renderer has laid out, then does the first fit.
function measureBase(attempt = 0): void {
  const screen = term?.element?.querySelector<HTMLElement>('.xterm-screen')
  const width = screen?.offsetWidth ?? 0
  if (width <= 0 && attempt < 5) {
    requestAnimationFrame(() => measureBase(attempt + 1))
    return
  }
  cellWidthBase = width / cols()
  fit()
}

function fit(): void {
  if (!term || !viewport.value || cellWidthBase <= 0) return
  const available = viewport.value.clientWidth
  if (available <= 0) return
  // Grid width at the base font size, derived from the measured column width.
  const baseWidth = cols() * cellWidthBase
  // Only ever shrink to fit — cap at the native size so it never upscales.
  const size = Math.min(BASE_FONT_SIZE, Math.max(5, (BASE_FONT_SIZE * available) / baseWidth))
  if (Math.abs(size - (term.options.fontSize ?? BASE_FONT_SIZE)) > 0.1) {
    term.options.fontSize = size
  }
}

const fontFamily = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

// Terminal colors come from CSS variables so the player matches its host theme
// (e.g. the docs map --player-terminal-* to VitePress --vp-* tokens). Falls back
// to the standalone dark palette when unset.
function readColor(name: string, fallback: string): string {
  const value = root.value && getComputedStyle(root.value).getPropertyValue(name).trim()
  return value || fallback
}

function applyTheme(): void {
  const theme = {
    background: readColor('--player-terminal-bg', '#0b0e14'),
    foreground: readColor('--player-terminal-fg', '#bfbdb6'),
  }
  if (term) term.options.theme = theme
}

// Play a new cast without remounting: match the terminal to its grid, replay from
// the start, and keep the playhead where it was (clamped to the new, possibly
// shorter, duration). The player owns none of this content — a parent that swaps
// the `cast` prop (e.g. to preview an edit) drives it through here.
function applyCast(next: Cast): void {
  castData.value = next
  if (!term) return
  const wasPlaying = playing.value
  pause()
  term.resize(
    next.header.width > 0 ? next.header.width : 80,
    next.header.height > 0 ? next.header.height : 24,
  )
  term.reset()
  writtenIndex = 0
  const target = Math.min(elapsed.value, next.duration)
  writeUpTo(target)
  elapsed.value = target
  anchorElapsed = target
  anchorWall = performance.now()
  // The new grid may have a different column count; refit from the measured column
  // width (a constant — no DOM re-measure, which would misread the shrunken font).
  fit()
  if (wasPlaying) play()
}

// React when the parent swaps in a different cast object. (Before the terminal
// exists, storing it is enough — start() reads castData.)
watch(
  () => props.cast,
  (next) => {
    if (next) applyCast(next)
  },
)

async function resolveCast(): Promise<Cast | null> {
  if (castData.value) return castData.value
  if (!props.src) return null
  try {
    const res = await fetch(props.src)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    castData.value = parseCast(await res.text())
    return castData.value
  } catch (err) {
    loadError.value = `Couldn't load recording: ${err instanceof Error ? err.message : String(err)}`
    return null
  }
}

async function start(): Promise<void> {
  if (started) return
  started = true

  const cast = await resolveCast()
  if (!cast || !mount.value) return

  // xterm measures glyph width when it opens, so wait for the webfont first —
  // otherwise it measures the fallback and every cell is misaligned.
  if (document.fonts?.load) await document.fonts.load(`${BASE_FONT_SIZE}px "JetBrains Mono"`)
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
    theme: {
      background: readColor('--player-terminal-bg', '#0b0e14'),
      foreground: readColor('--player-terminal-fg', '#bfbdb6'),
    },
  })
  term.open(mount.value)

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

  measureBase()
  resizeObserver = new ResizeObserver(() => fit())
  if (viewport.value) resizeObserver.observe(viewport.value)

  // Re-read the terminal colors when the host toggles light/dark.
  themeObserver = new MutationObserver(() => applyTheme())
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  play()
}

onMounted(() => {
  if (!root.value) return
  // Defer the (heavy) terminal + cast fetch until the player is on screen.
  visibilityObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        visibilityObserver?.disconnect()
        start()
      }
    },
    { rootMargin: '200px' },
  )
  visibilityObserver.observe(root.value)
})

onBeforeUnmount(() => {
  pause()
  visibilityObserver?.disconnect()
  resizeObserver?.disconnect()
  themeObserver?.disconnect()
  term?.dispose()
})
</script>

<template>
  <div ref="root" class="session-player" tabindex="0" @keydown="onKeydown">
    <div ref="viewport" class="viewport">
      <div ref="mount" class="terminal" />
    </div>

    <p v-if="loadError" class="error">{{ loadError }}</p>

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
        :max="duration"
        step="0.01"
        :value="elapsed"
        @input="onScrub"
      />

      <span class="time">{{ formatTime(elapsed) }} / {{ formatTime(duration) }}</span>

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
  background: var(--player-bg, #0b0e14);
  border: 1px solid var(--player-border, #1c2230);
  border-radius: 8px;
}

.session-player:focus-visible {
  outline: none;
  border-color: var(--player-control-border, #2a3142);
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

.error {
  margin: 0;
  padding: 0.6rem 0.9rem;
  color: var(--player-error-fg, #ffb4b4);
  background: var(--player-error-bg, #2a1518);
  border: 1px solid var(--player-error-border, #5a2a2f);
  border-radius: 6px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  color: var(--player-fg, #bfbdb6);
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
  color: var(--player-fg, #bfbdb6);
  background: var(--player-control-bg, #131721);
  border: 1px solid var(--player-control-border, #2a3142);
  border-radius: 5px;
  cursor: pointer;
}

.btn:hover {
  background: var(--player-control-hover-bg, #1c2230);
}

.btn.active {
  color: var(--player-accent-fg, #0b0e14);
  background: var(--player-accent, #59c2ff);
  border-color: var(--player-accent, #59c2ff);
}

.scrubber {
  flex: 1 1 120px;
  min-width: 0;
  accent-color: var(--player-accent, #59c2ff);
  cursor: pointer;
}

.time {
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

.speed {
  color: var(--player-fg, #bfbdb6);
  background: var(--player-control-bg, #131721);
  border: 1px solid var(--player-control-border, #2a3142);
  border-radius: 5px;
  padding: 0.2rem 0.35rem;
}
</style>
