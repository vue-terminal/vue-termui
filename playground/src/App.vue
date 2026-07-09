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
onKeyDown((key) => {
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
  <Box flexDirection="row" :padding="1" :gap="1">
    <Sidebar />
    <Box :flexGrow="1">
      <Box flexDirection="column" :gap="1">
        <Text>App shell: a fixed sidebar on the left and the routed page on the right.</Text>
        <Text>Focused element {{ focusedElement?.id }}</Text>
        <RouterView />
      </Box>
    </Box>
  </Box>
</template>
