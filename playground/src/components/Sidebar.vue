<script setup lang="ts">
// Sidebar navigation built from focusable links (no RouterLink — that renders a
// DOM <a>). The links are real OpenTUI focusables; ↑/↓ move focus between them
// and Enter pushes the focused route. Esc returns focus to the sidebar from
// whatever page widget grabbed it (e.g. a focused Input or Select).
import {
  Box,
  Newline,
  nextTick,
  onKeyDown,
  onMounted,
  ref,
  ScrollBox,
  Text,
  useExit,
  useTemplateRef,
} from 'vue-termui'
import { useRouter } from 'vue-router'
import SidebarLink from './SidebarLink.vue'

const router = useRouter()
const exit = useExit()

// Each item either navigates (`to`) or runs an action (`action`). "Quit" is the
// only way to close the app now that Ctrl+C is disabled (see main.ts).
const items = [
  { label: 'Home', to: '/' },
  { label: 'Text & styles', to: '/text-styles' },
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
] as const

// Public instances of each SidebarLink, collected via function refs.
const links = ref<
  Array<{ focus: () => void; focused: boolean; element: { id: string } | null } | null>
>([])

// The nav list no longer fits a terminal, so it scrolls; keep the focused link
// visible whenever focus moves.
const nav = useTemplateRef('nav')

function indexOfFocused(): number {
  return links.value.findIndex((link) => link?.focused)
}

function focusAt(index: number): void {
  const count = items.length
  const link = links.value[((index % count) + count) % count]
  link?.focus()
  if (link?.element) {
    nav.value?.$el.scrollChildIntoView(link.element.id)
  }
}

onMounted(async () => {
  // Wait for the child links to mount (and mark themselves focusable).
  await nextTick()
  focusAt(0)
})

onKeyDown((key) => {
  // Esc always pulls focus back to the sidebar, even from a focused page widget.
  if (key.name === 'escape') {
    const current = indexOfFocused()
    focusAt(current < 0 ? 0 : current)
    return
  }

  const current = indexOfFocused()
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
  <Box
    flexDirection="column"
    :width="22"
    :flexShrink="0"
    borderColor="red"
    borderStyle="rounded"
    :padding="1"
    focusedBorderColor="blue"
  >
    <Text bold fg="#42b883">vue-termui</Text>
    <Newline />
    <!-- The list outgrew the terminal: scroll it, but keep it out of the Tab
         cycle (links are the focusables; focusAt scrolls them into view). -->
    <ScrollBox ref="nav" :focusable="false" :flexGrow="1" :flexShrink="1">
      <SidebarLink
        v-for="(item, i) in items"
        :key="item.label"
        :ref="(el) => (links[i] = el as any)"
        :label="item.label"
        @selected="router.push(item.to)"
      />
      <SidebarLink @selected="exit()" label="Quit" />
    </ScrollBox>
    <Newline />
    <Text fg="#666666">↑/↓ move · ⏎ open</Text>
    <Text fg="#666666">⇥ / ⇧⇥ cycle focus</Text>
    <Text fg="#666666">Esc focus nav</Text>
    <Text fg="#666666">⏎ Quit to exit</Text>
  </Box>
</template>
