<script setup lang="ts">
// App shell: a fixed sidebar on the left and the routed page on the right.
// RouterView is imported locally; RouterLink is never used (it renders a DOM
// <a>, which the terminal renderer can't mount) — the sidebar pushes routes
// imperatively instead.
import { Box, onMounted, onUnmounted, ref, Text, useInterval, useRenderer } from 'vue-termui'
import { RouterView, useRouter } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import { DebugOverlayCorner } from '@opentui/core'
import { useIntervalFn, useNow } from '@vueuse/core'

const router = useRouter()
const renderer = useRenderer()

renderer.configureDebugOverlay({
  enabled: true,
  corner: DebugOverlayCorner.topRight,
})

onMounted(() => {
  console.log('App mounted')
  renderer.setTerminalTitle(`VueTermUI Playground - ${new Date().toLocaleString()}`)
  renderer.console.show()
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
</script>

<template>
  <Box flexDirection="row" :padding="1" :gap="1">
    <Sidebar />
    <Box :flexGrow="1">
      <Box flexDirection="column" :gap="1">
        <Text>App shell: a fixed sidebar on the left and the routed page on the right.</Text>
        <RouterView />
      </Box>
    </Box>
  </Box>
</template>
