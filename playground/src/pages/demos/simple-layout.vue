<script setup lang="ts">
// Ported from @opentui/examples src/simple-layout-example.ts
import {
  Box,
  computed,
  onKeyDown,
  onMounted,
  onResize,
  ref,
  Text,
  useInterval,
  useTemplateRef,
  useTerminalSize,
} from 'vue-termui'

const demos = [
  { name: 'Horizontal Layout', description: 'Sidebar on left, main content on right' },
  { name: 'Vertical Layout', description: 'Sidebar on top, main content below' },
  { name: 'Centered Layout', description: 'Content centered with margins' },
  { name: 'Three Column', description: 'Left sidebar, center content, right sidebar' },
] as const

const demoIndex = ref(0)
const autoplay = ref(true)

function nextDemo() {
  demoIndex.value = (demoIndex.value + 1) % demos.length
}

// Auto-advance every 4s while autoplay is on.
useInterval(() => {
  if (autoplay.value) nextDemo()
}, 4000)

const headerText = computed(
  () =>
    `${demos[demoIndex.value]!.name} (${demoIndex.value + 1}/${demos.length}) - ${
      autoplay.value ? 'AUTO' : 'MANUAL'
    }`,
)

// The demo fills the page area below the app shell chrome.
const { width: cols, height: rows } = useTerminalSize()
const demoHeight = computed(() => Math.max(16, rows.value - 8))

// Moveable overlay (WASD), clamped to the demo container.
const OVERLAY_W = 8
const OVERLAY_H = 3
const overlayVisible = ref(true)
const overlayX = ref(0)
const overlayY = ref(0)

const container = useTemplateRef('container')

function areaSize() {
  const el = container.value?.$el
  return {
    width: el && el.width > 0 ? el.width : cols.value,
    height: el && el.height > 0 ? el.height : rows.value,
  }
}

function moveOverlay(dx: number, dy: number) {
  const { width, height } = areaSize()
  overlayX.value = Math.max(0, Math.min(width - OVERLAY_W, overlayX.value + dx))
  overlayY.value = Math.max(0, Math.min(height - OVERLAY_H, overlayY.value + dy))
}

function centerOverlay() {
  const { width, height } = areaSize()
  overlayX.value = Math.floor((width - OVERLAY_W) / 2)
  overlayY.value = Math.floor((height - OVERLAY_H) / 2)
}

onMounted(centerOverlay)
onResize(centerOverlay)

onKeyDown((key) => {
  switch (key.name) {
    case 'space':
      nextDemo()
      break
    case 'r':
      demoIndex.value = 0
      break
    case 'p':
      autoplay.value = !autoplay.value
      break
    case 'v':
      overlayVisible.value = !overlayVisible.value
      break
    case 'w':
      moveOverlay(0, -1)
      break
    case 'a':
      moveOverlay(-1, 0)
      break
    case 's':
      moveOverlay(0, 1)
      break
    case 'd':
      moveOverlay(1, 0)
      break
  }
})

const footerText = computed(
  () =>
    `SPACE: next | R: restart | P: autoplay (${autoplay.value ? 'ON' : 'OFF'}) | V: overlay (${
      overlayVisible.value ? 'ON' : 'OFF'
    }) | WASD: move`,
)
</script>

<template>
  <Box ref="container" position="relative" flexDirection="column" width="100%" :height="demoHeight">
    <!-- Header -->
    <Box
      :height="3"
      backgroundColor="#3b82f6"
      :border="true"
      borderStyle="single"
      alignItems="center"
    >
      <Text fg="#ffffff">{{ headerText }}</Text>
    </Box>

    <!-- Content area: direction/justify depend on the current layout demo -->
    <Box
      :flexGrow="1"
      :flexShrink="1"
      :flexDirection="demoIndex === 1 ? 'column' : 'row'"
      alignItems="stretch"
      :justifyContent="demoIndex === 2 ? 'center' : 'flex-start'"
    >
      <!-- Horizontal: left sidebar + main -->
      <template v-if="demoIndex === 0">
        <Box
          width="20%"
          :minWidth="15"
          backgroundColor="#64748b"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">LEFT SIDEBAR</Text>
        </Box>
        <Box
          :flexGrow="1"
          :flexShrink="1"
          :minWidth="20"
          backgroundColor="#eab308"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#1e293b">MAIN CONTENT</Text>
        </Box>
      </template>

      <!-- Vertical: top bar + main -->
      <template v-else-if="demoIndex === 1">
        <Box
          height="20%"
          :minHeight="3"
          backgroundColor="#059669"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">TOP BAR</Text>
        </Box>
        <Box
          :flexGrow="1"
          :flexShrink="1"
          :minHeight="5"
          backgroundColor="#eab308"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#1e293b">MAIN CONTENT</Text>
        </Box>
      </template>

      <!-- Centered: single column of content, centered by the parent -->
      <template v-else-if="demoIndex === 2">
        <Box
          width="60%"
          :minWidth="30"
          maxWidth="80%"
          backgroundColor="#7c3aed"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">CENTERED CONTENT</Text>
        </Box>
      </template>

      <!-- Three column: left + center + right -->
      <template v-else>
        <Box
          width="15%"
          :minWidth="12"
          backgroundColor="#dc2626"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">LEFT</Text>
        </Box>
        <Box
          :flexGrow="1"
          :flexShrink="1"
          :minWidth="20"
          backgroundColor="#059669"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">CENTER</Text>
        </Box>
        <Box
          width="15%"
          :minWidth="12"
          backgroundColor="#7c3aed"
          :border="true"
          borderStyle="single"
          alignItems="center"
          justifyContent="center"
        >
          <Text fg="#ffffff">RIGHT</Text>
        </Box>
      </template>
    </Box>

    <!-- Footer -->
    <Box
      :height="3"
      backgroundColor="#1e40af"
      :border="true"
      borderStyle="single"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#ffffff">{{ footerText }}</Text>
    </Box>

    <!-- Moveable overlay (toggled with V, moved with WASD) -->
    <Box
      v-if="overlayVisible"
      position="absolute"
      :left="overlayX"
      :top="overlayY"
      :width="OVERLAY_W"
      :height="OVERLAY_H"
      :zIndex="100"
      backgroundColor="#ff6b6b"
      :border="true"
      borderStyle="single"
      borderColor="#ff4757"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#ffffff">MOVE</Text>
    </Box>

    <!-- Absolutely positioned box anchored to the bottom-right corner -->
    <Box
      position="absolute"
      :bottom="1"
      :right="1"
      :width="20"
      :height="3"
      :zIndex="150"
      backgroundColor="#22c55e"
      :border="true"
      borderStyle="single"
      borderColor="#16a34a"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#ffffff">BOTTOM RIGHT</Text>
    </Box>
  </Box>
</template>
