<script setup lang="ts">
// Sidebar navigation built from focusable links (no RouterLink — that renders a
// DOM <a>). The links are real OpenTUI focusables; ↑/↓ move focus between them
// and Enter pushes the focused route. Esc returns focus to the sidebar from
// whatever page widget grabbed it (e.g. a focused Input or Select).
import { Box, Newline, nextTick, onKeyDown, onMounted, ref, Text, useExit } from 'vue-termui'
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
  { label: 'Quit', action: 'exit' },
] as const

// Public instances of each SidebarLink, collected via function refs.
const links = ref<Array<{ focus: () => void; focused: boolean } | null>>([])

function indexOfFocused(): number {
  return links.value.findIndex((link) => link?.focused)
}

function focusAt(index: number): void {
  const count = items.length
  links.value[((index % count) + count) % count]?.focus()
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
  } else if (key.name === 'return') {
    const item = items[current]
    if ('action' in item && item.action === 'exit') {
      exit()
    } else if ('to' in item) {
      router.push(item.to)
    }
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
    <SidebarLink
      v-for="(item, i) in items"
      :key="item.label"
      :ref="(el) => (links[i] = el as any)"
      :label="item.label"
    />
    <Newline />
    <Text fg="#666666">↑/↓ move · ⏎ open</Text>
    <Text fg="#666666">⇥ / ⇧⇥ cycle focus</Text>
    <Text fg="#666666">Esc focus nav</Text>
    <Text fg="#666666">⏎ Quit to exit</Text>
  </Box>
</template>
