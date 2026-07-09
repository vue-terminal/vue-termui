<script setup lang="ts">
// Ported from @opentui/examples src/relative-positioning-demo.ts
import { Box, computed, onKeyDown, ref, Text, useInterval } from 'vue-termui'

const SPEED_MIN = 500
const SPEED_MAX = 8000
const animationSpeed = ref(4000)
const animationTime = ref(0)

// ~30fps animation clock (the standalone demo used the renderer frame callback).
const TICK_MS = 33
useInterval(() => {
  animationTime.value += TICK_MS
}, TICK_MS)

// Parent A moves in a circle; its flex children follow along.
const parentAPos = computed(() => {
  const angle = (animationTime.value / animationSpeed.value) * Math.PI * 2
  return {
    left: Math.round(20 + Math.cos(angle) * 15),
    top: Math.round(8 + (Math.sin(angle) * 15) / 2),
  }
})

// Parent B oscillates vertically.
const parentBTop = computed(() => {
  const angle = (animationTime.value / (animationSpeed.value * 1.5)) * Math.PI * 2
  return Math.round(8 + Math.sin(angle) * 8)
})

onKeyDown((key) => {
  if (key.name === '+' || key.name === '=') {
    animationSpeed.value = Math.max(SPEED_MIN, animationSpeed.value - 300)
  } else if (key.name === '-' || key.name === '_') {
    animationSpeed.value = Math.min(SPEED_MAX, animationSpeed.value + 300)
  }
})
</script>

<template>
  <Box position="relative" width="100%" :height="37" :zIndex="10">
    <Text position="absolute" :left="5" :top="1" fg="#FFFF00" bold underline :zIndex="1000">
      Relative Positioning Demo - Child positions are relative to parent
    </Text>

    <!-- Parent A: animated container; children are laid out with flex inside -->
    <Box position="absolute" :left="parentAPos.left" :top="parentAPos.top" :zIndex="50">
      <Box
        :width="40"
        :height="12"
        backgroundColor="#220044"
        :zIndex="1"
        :border="true"
        borderStyle="double"
        borderColor="#FF44FF"
        title="Parent A (moves in circle)"
        titleAlignment="center"
        flexDirection="row"
        alignItems="stretch"
        justifyContent="space-between"
      >
        <Box
          backgroundColor="#440066"
          :zIndex="2"
          :border="true"
          borderStyle="single"
          borderColor="#FF88FF"
          title="Child 1"
          titleAlignment="center"
          :flexGrow="1"
          :flexShrink="1"
          :minWidth="8"
        />
        <Box
          backgroundColor="#660044"
          :zIndex="2"
          :border="true"
          borderStyle="single"
          borderColor="#FF88FF"
          title="Child 2"
          titleAlignment="center"
          :flexGrow="1"
          :flexShrink="1"
          :minWidth="8"
        />
        <Box
          backgroundColor="#440044"
          :zIndex="2"
          :border="true"
          borderStyle="single"
          borderColor="#FF88FF"
          title="Child 3"
          titleAlignment="center"
          :flexGrow="1"
          :flexShrink="1"
          :minWidth="8"
        />
      </Box>
    </Box>

    <!-- Parent B: moves vertically; children keep their relative flow positions -->
    <Box position="absolute" :left="50" :top="parentBTop" :zIndex="50">
      <Box
        :width="40"
        :height="10"
        backgroundColor="#004422"
        :zIndex="1"
        :border="true"
        borderStyle="rounded"
        borderColor="#44FF44"
        title="Parent B (moves vertically)"
        titleAlignment="center"
        :padding="1"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Text fg="#44FF44" bold :zIndex="2">Parent B Position: (50, {{ parentBTop }})</Text>
        <Text fg="#88FF88" :zIndex="2">Child at (1,3) - relative to parent</Text>
        <Text fg="#88FF88" :zIndex="2">Child at (1,5) - relative to parent</Text>
      </Box>
    </Box>

    <!-- Static parent: never moves -->
    <Box position="absolute" :left="5" :top="20" :zIndex="50">
      <Box
        :width="40"
        :height="8"
        backgroundColor="#442200"
        :zIndex="1"
        :border="true"
        borderStyle="single"
        borderColor="#FFFF44"
        title="Static Parent (doesn't move)"
        titleAlignment="center"
        :padding="1"
        flexDirection="column"
        overflow="hidden"
      >
        <Text fg="#FFFF88" :zIndex="2">Static child at (2,2) - never moves</Text>
        <Text fg="#FFFF88" :zIndex="2">Static child at (2,4) - never moves</Text>
      </Box>
    </Box>

    <Text position="absolute" :left="5" :top="30" fg="#AAAAAA" bold :zIndex="1000">
      Key Concept: Parent A uses flex layout - children are arranged in a row
    </Text>
    <Text position="absolute" :left="5" :top="31" fg="#AAAAAA" :zIndex="1000">
      When parent moves, children move with it while maintaining flex layout
    </Text>
    <Text position="absolute" :left="5" :top="32" fg="#AAAAAA" :zIndex="1000">
      Flex children automatically fit parent width and grow/shrink as needed
    </Text>

    <Text position="absolute" :left="5" :top="34" fg="#FFFFFF" bold :zIndex="1000">
      Controls: +/- to change animation speed
    </Text>
    <Text position="absolute" :left="5" :top="35" fg="#CCCCCC" :zIndex="1000">
      Animation Speed: {{ animationSpeed }}ms (min: {{ SPEED_MIN }}, max: {{ SPEED_MAX }})
    </Text>
  </Box>
</template>
