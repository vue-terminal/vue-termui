<script setup lang="ts">
// Sidebar navigation built from focusable links (no RouterLink — that renders a
// DOM <a>). The links are real OpenTUI focusables; ↑/↓ move focus between them
// and Enter pushes the focused route. Esc returns focus to the sidebar from
// whatever page widget grabbed it (e.g. a focused Input or Select).
//
// A filter Input sits on top: `/` focuses it and typing narrows the list.
// Ctrl+N/Ctrl+P jump to the next/previous page of the (filtered) list from
// anywhere in the app.
import {
  Box,
  computed,
  Input,
  nextTick,
  onKeyDown,
  onMounted,
  ref,
  ScrollBox,
  Text,
  useCurrentFocusedElement,
  useExit,
  useTemplateRef,
  watch,
} from 'vue-termui'
import { useRouter } from 'vue-router'
import SidebarLink from './SidebarLink.vue'

const router = useRouter()
const exit = useExit()

const items = [
  { label: 'Home', to: '/' },
  { label: 'Text & styles', to: '/text-styles' },
  { label: 'Image', to: '/image' },
  { label: 'Markdown', to: '/markdown' },
  { label: 'Markdown themes', to: '/markdown-themes' },
  { label: 'Layout', to: '/layout' },
  { label: 'Select', to: '/select' },
  { label: 'Tab select', to: '/tab-select' },
  { label: 'Scroll box', to: '/scrollbox' },
  { label: 'Textarea', to: '/textarea' },
  { label: 'Keyboard', to: '/keyboard' },
  { label: 'Event modifiers', to: '/event-modifiers' },
  { label: 'Soundboard', to: '/sounds' },
  { label: 'Form', to: '/demos/form' },
  { label: 'Bouncing box', to: '/demos/bouncing-box' },
  // Pages ported from opentui's packages/examples.
  { label: 'Input', to: '/demos/input' },
  { label: 'Input + Select', to: '/demos/input-select-layout' },
  { label: 'Select showcase', to: '/demos/select-showcase' },
  { label: 'Tab showcase', to: '/demos/tab-select-showcase' },
  { label: 'Simple layout', to: '/demos/simple-layout' },
  { label: 'Positioning', to: '/demos/relative-positioning' },
  { label: 'Nested z-index', to: '/demos/nested-zindex' },
  { label: 'Opacity', to: '/demos/opacity' },
  { label: 'Transparency', to: '/demos/transparency' },
  { label: 'Styled text', to: '/demos/styled-text' },
  { label: 'Text truncation', to: '/demos/text-truncation' },
  { label: 'ScrollBox mouse', to: '/demos/scrollbox-mouse' },
  { label: 'Scroll overlay', to: '/demos/scrollbox-overlay' },
  { label: 'Sticky scroll', to: '/demos/sticky-scroll' },
  { label: 'Keypress debug', to: '/demos/keypress-debug' },
  { label: 'Focus restore', to: '/demos/focus-restore' },
  { label: 'Notifications', to: '/demos/notifications' },
  { label: 'Terminal title', to: '/demos/terminal-title' },
  { label: 'Text selection', to: '/demos/text-selection' },
  { label: 'Fractal (3D)', to: '/demos/fractal' },
  { label: 'Aurora (3D)', to: '/demos/aurora' },
  { label: 'Undertones (shaders.com)', to: '/demos/undertones' },
  { label: 'Collapsing Grid (shaders.com)', to: '/demos/collapsing-grid' },
  { label: 'Draggable cube (3D)', to: '/demos/draggable-cube' },
  { label: 'Shader cube (3D)', to: '/demos/shader-cube' },
  { label: 'ASCII donut (3D)', to: '/demos/ascii-donut' },
  { label: 'Texture loading (3D)', to: '/demos/texture' },
  { label: 'Static sprite (3D)', to: '/demos/static-sprite' },
  { label: 'Sprite particles (3D)', to: '/demos/sprite-particles' },
  { label: 'TresJS scene (3D)', to: '/demos/tres' },
  { label: 'TresJS ASCII (3D)', to: '/demos/tres-ascii' },
  { label: 'Camera (webcam)', to: '/demos/camera' },
  { label: 'Domino tiles', to: '/demos/dominos' },
] as const

type NavRoute = (typeof items)[number]['to']

/**
 * An entry either navigates (`to`) or runs an action (`action`). "Quit" is the
 * only way to close the app now that Ctrl+C is disabled (see main.ts).
 */
interface NavEntry {
  label: string
  to?: NavRoute
  action?: () => void
}

const entries: NavEntry[] = [...items, { label: 'Quit', action: () => exit() }]

const query = ref('')

// Every whitespace-separated token must appear in the label or the path, so
// "3d tres" and "tres 3d" both find the TresJS demos.
const shownEntries = computed<NavEntry[]>(() => {
  const tokens = query.value.toLowerCase().split(/\s+/).filter(Boolean)
  if (!tokens.length) return entries
  return entries.filter((entry) => {
    const haystack = `${entry.label} ${entry.to ?? ''}`.toLowerCase()
    return tokens.every((token) => haystack.includes(token))
  })
})

// Index into `shownEntries` of the highlighted entry. Narrowing the list always
// restarts at the top.
const selected = ref(0)
watch(shownEntries, () => {
  selected.value = 0
})

// Public instances of the mounted SidebarLinks, keyed by label (labels are
// unique and also the v-for key). A Map survives the list changing under a
// filter, unlike index-based refs.
type LinkInstance = { focus: () => void; focused: boolean; element: { id: string } | null }
const links = new Map<string, LinkInstance>()
function setLink(label: string, instance: unknown): void {
  if (instance) {
    links.set(label, instance as LinkInstance)
  } else {
    links.delete(label)
  }
}

// The nav list no longer fits a terminal, so it scrolls; keep the focused link
// visible whenever focus moves.
const nav = useTemplateRef('nav')
const filter = useTemplateRef('filter')
const currentFocused = useCurrentFocusedElement()
const filterFocused = computed(() => !!filter.value && currentFocused.value === filter.value.$el)

function indexOfFocused(): number {
  return shownEntries.value.findIndex((entry) => links.get(entry.label)?.focused)
}

function scrollIntoView(index: number): void {
  const element = links.get(shownEntries.value[index]!.label)?.element
  if (element) {
    nav.value?.$el.scrollChildIntoView(element.id)
  }
}

/**
 * Move the selection (the highlighted entry) to `index`, wrapping around, and
 * scroll it into view. Selection is plain state, deliberately decoupled from
 * OpenTUI focus: a page that grabs focus on mount can't interrupt a Ctrl+N walk
 * through the list. Returns the normalized index, or -1 when nothing is shown.
 */
function select(index: number): number {
  const count = shownEntries.value.length
  if (!count) return -1
  selected.value = ((index % count) + count) % count
  scrollIntoView(selected.value)
  return selected.value
}

function selectSibling(step: 1 | -1): void {
  select(selected.value + step)
}

/**
 * Select `index` and move focus onto its link, so Enter/↑/↓ keep working from
 * the list itself.
 */
function focusAt(index: number): void {
  const next = select(index)
  if (next >= 0) links.get(shownEntries.value[next]!.label)?.focus()
}

function activate(entry: NavEntry | undefined): void {
  if (!entry) return
  if (entry.to) {
    router.push(entry.to)
  } else {
    entry.action?.()
  }
}

/**
 * Enter: open whatever is selected. This is the only way Ctrl+N/Ctrl+P lead to
 * a navigation — walking the list on its own never mounts a page.
 */
function openSelected(): void {
  activate(shownEntries.value[selected.value])
}

function openAt(index: number): void {
  select(index)
  openSelected()
}

function focusFilter(): void {
  filter.value?.$el?.focus()
}

onMounted(async () => {
  // Wait for the child links to mount (and mark themselves focusable).
  await nextTick()
  focusAt(0)
})

onKeyDown((key) => {
  // Esc always pulls focus back to the sidebar, even from a focused page widget
  // (including the filter Input) — onto the selected entry, so an interrupted
  // Ctrl+N walk resumes where it left off.
  if (key.name === 'escape') {
    const current = indexOfFocused()
    focusAt(current < 0 ? selected.value : current)
    return
  }

  const current = indexOfFocused()

  // `/` opens the filter, but only from the sidebar or with nothing focused —
  // otherwise a slash typed into a page's Input would teleport focus here.
  // preventDefault keeps the slash itself out of the filter we just focused.
  if (key.name === '/' && !key.ctrl && !key.meta && (current >= 0 || !currentFocused.value)) {
    key.preventDefault()
    focusFilter()
    return
  }

  // The filter owns its own keys (Ctrl+N/Ctrl+P and ↑/↓ move the selection),
  // bound declaratively on the Input so they never fire from anywhere else.
  if (filterFocused.value) return

  // When focus lives on the page (e.g. a focused Input), let the page have the
  // keys — only react while one of our links is focused. Tab/Shift+Tab cycling
  // is handled globally in App.vue across every focusable element.
  if (current < 0) return

  if (key.name === 'down') {
    focusAt(current + 1)
  } else if (key.name === 'up') {
    focusAt(current - 1)
  }
})
</script>

<template>
  <!-- The width follows the longest visible label, so filtering the list would
       make the sidebar (and the page next to it) jump around: pin a floor. -->
  <Box
    flexDirection="column"
    :minWidth="26"
    :maxWidth="32"
    borderColor="#666666"
    borderStyle="heavy"
    title=" Vue TermUI "
    titleColor="white"
    titleAlignment="center"
    focusedBorderColor="#ff6af0"
  >
    <Box
      :border="['bottom']"
      borderColor="#666666"
      :paddingLeft="1"
      :paddingRight="1"
      :flexShrink="0"
    >
      <Input
        ref="filter"
        v-model="query"
        width="100%"
        placeholder="/ filter…"
        textColor="#eeeeee"
        placeholderColor="#666666"
        cursorColor="#42b883"
        @keyDown.ctrl.n.prevent="selectSibling(1)"
        @keyDown.ctrl.p.prevent="selectSibling(-1)"
        @keyDown.down.prevent="selectSibling(1)"
        @keyDown.up.prevent="selectSibling(-1)"
        @enter="openSelected()"
      />
    </Box>
    <!-- The list outgrew the terminal: scroll it, but keep it out of the Tab
         cycle (links are the focusables; focusAt scrolls them into view). -->
    <ScrollBox ref="nav" :focusable="false" :flexGrow="1" :flexShrink="1">
      <SidebarLink
        v-for="(entry, index) in shownEntries"
        :key="entry.label"
        :ref="(el) => setLink(entry.label, el)"
        :label="entry.label"
        :selected="index === selected"
        @selected="openAt(index)"
      />
      <Text v-if="!shownEntries.length" fg="#666666"> no match</Text>
    </ScrollBox>
    <Box
      flexDirection="column"
      alignItems="flex-end"
      :border="['top']"
      :paddingRight="2"
      :flexShrink="0"
    >
      <Text fg="#666666">↑/↓ ⌃n/⌃p select</Text>
      <Text fg="#666666">⏎ open</Text>
      <Text fg="#666666">/ filter{{ query ? ` (${shownEntries.length})` : '' }}</Text>
    </Box>
  </Box>
</template>
