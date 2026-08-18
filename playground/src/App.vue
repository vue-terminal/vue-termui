<script setup lang="ts">
// App shell: a fixed sidebar on the left and the routed page on the right.
// RouterView is imported locally; RouterLink is never used (it renders a DOM
// <a>, which the terminal renderer can't mount) — the sidebar pushes routes
// imperatively instead.
import {
  Box,
  onKeyDown,
  onMounted,
  onUnmounted,
  ref,
  Text,
  useCurrentFocusedElement,
  useFocusManager,
  useRenderer,
} from 'vue-termui'
import { RouterView, useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { DebugOverlayCorner } from '@opentui/core'

const router = useRouter()
const renderer = useRenderer()

// App-wide Tab focus cycling across every focusable element (sidebar links plus
// whatever the current page renders). `useFocusManager` walks the render tree
// in order and wraps around; OpenTUI doesn't cycle focus on Tab itself.
const { focusNext, focusPrevious } = useFocusManager()

// Ctrl+F unmounts the shell chrome so the routed page owns the whole terminal.
// Unmounting, not hiding: a hidden sidebar keeps its key handlers, so `/` would
// focus the invisible filter.
const fullscreen = ref(false)

onKeyDown((key) => {
  if (key.name === 'f' && key.ctrl) {
    fullscreen.value = !fullscreen.value
    return
  }

  if (key.name === 'c' && key.shift) {
    renderer.console.toggle()
    return
  }

  if (key.name !== 'tab') return
  // TODO: it probably depends, probably allowing .stop modifier on nested children
  // currently, this listener goes first
  key.preventDefault()
  if (key.shift) {
    focusPrevious()
  } else {
    focusNext()
  }
})

renderer.configureDebugOverlay({
  enabled: false,
  corner: DebugOverlayCorner.topRight,
})

onMounted(() => {
  console.log('App mounted')
  renderer.setTerminalTitle(`VueTermUI Playground - ${new Date().toLocaleString()}`)
})

const removeGuard = router.beforeEach((to, from) => {
  console.log(`Navigating from ${from.fullPath} to ${to.fullPath}`)
})

const removeAfter = router.afterEach((to, from, failure) => {
  if (failure) {
    console.log(`Navigation to ${to.fullPath} failed:`, failure)
  } else {
    console.log(`Navigation to ${to.fullPath} succeeded`)
  }
})

onUnmounted(() => {
  console.log('App unmounted')
  removeGuard()
  removeAfter()
})

const focusedElement = useCurrentFocusedElement()
</script>

<template>
  <!-- flexGrow to fill the terminal, so the key bar stays at the bottom. -->
  <Box :flexGrow="1">
    <Box flexDirection="row" :padding="fullscreen ? 0 : 1" :gap="1" :flexGrow="1">
      <Sidebar v-if="!fullscreen" />
      <Box flexDirection="column" :gap="1" :flexGrow="1">
        <template v-if="!fullscreen">
          <Text>App shell: a fixed sidebar on the left and the routed page on the right.</Text>
          <Text>Focused element {{ focusedElement?.id }}</Text>
        </template>
        <RouterView />
      </Box>
    </Box>
    <Box
      v-if="!fullscreen"
      flexDirection="row"
      :gap="1"
      alignItems="flex-end"
      :border="['top']"
      borderColor="#42b883"
      :paddingLeft="2"
      :flexShrink="0"
    >
      <Text>↹ cycle focus</Text>
      <Text dim>|</Text>
      <Text>/ filter</Text>
      <Text dim>|</Text>
      <Text>⇧c console</Text>
      <Text dim>|</Text>
      <Text>⌃f fullscreen</Text>
      <Text dim>|</Text>
      <Text>⌃c exit</Text>
    </Box>
  </Box>
</template>
