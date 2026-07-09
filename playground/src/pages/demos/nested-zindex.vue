<script setup lang="ts">
// Ported from @opentui/examples src/nested-zindex-demo.ts
import { Box, computed, onKeyDown, ref, Text, useInterval } from 'vue-termui'

const SPEED_MIN = 500
const SPEED_MAX = 5000
const animationSpeed = ref(2000)
const phase = ref(0)

// Cycle through the 4 z-index phases (the standalone demo used the renderer
// frame callback; polling the clock keeps the phase in sync with the speed).
useInterval(() => {
  phase.value = Math.floor((Date.now() % (animationSpeed.value * 4)) / animationSpeed.value)
}, 100)

// Parent group z-indices per phase. Child z-indices never change — the point of
// the demo is that the parent's z-index decides group layering first.
const zIndices = computed(() => {
  switch (phase.value) {
    case 1: // C becomes highest
      return { a: 50, b: 20, c: 100 }
    case 2: // B becomes highest
      return { a: 20, b: 100, c: 50 }
    case 3: // All equal - shows child z-index importance
      return { a: 60, b: 60, c: 60 }
    default: // Original state
      return { a: 100, b: 50, c: 20 }
  }
})

const phaseNames = [
  'Original Hierarchy',
  'C Group on Top',
  'B Group on Top',
  'Equal Parents (Child z-index matters)',
]

onKeyDown((key) => {
  if (key.name === '+' || key.name === '=') {
    animationSpeed.value = Math.max(SPEED_MIN, animationSpeed.value - 200)
  } else if (key.name === '-' || key.name === '_') {
    animationSpeed.value = Math.min(SPEED_MAX, animationSpeed.value + 200)
  }
})
</script>

<template>
  <Box position="relative" width="100%" :height="31" :zIndex="10">
    <Text position="absolute" :left="10" :top="2" fg="#FFFF00" bold underline :zIndex="1000">
      Nested Render Objects & Z-Index Demo
    </Text>

    <!-- Group A -->
    <Box position="absolute" :left="0" :top="0" :zIndex="zIndices.a">
      <Box
        position="absolute"
        :left="15"
        :top="8"
        :width="25"
        :height="6"
        backgroundColor="#220044"
        :zIndex="10"
        :border="true"
        borderStyle="single"
        borderColor="#FF44FF"
        :title="`Parent A (z=${zIndices.a})`"
        titleAlignment="center"
      />
      <Text position="absolute" :left="17" :top="10" fg="#FF44FF" bold :zIndex="10">
        Child A1 (z=10)
      </Text>
      <Box
        position="absolute"
        :left="20"
        :top="11"
        :width="15"
        :height="4"
        backgroundColor="#440044"
        :zIndex="5"
        :border="true"
        borderStyle="single"
        borderColor="#FF88FF"
      />
      <Text position="absolute" :left="22" :top="12" fg="#FF88FF" :zIndex="5">
        Child A2 (z=5)
      </Text>
    </Box>

    <!-- Group B -->
    <Box position="absolute" :left="0" :top="0" :zIndex="zIndices.b">
      <Box
        position="absolute"
        :left="30"
        :top="12"
        :width="25"
        :height="6"
        backgroundColor="#004422"
        :zIndex="20"
        :border="true"
        borderStyle="double"
        borderColor="#44FF44"
        :title="`Parent B (z=${zIndices.b})`"
        titleAlignment="center"
      />
      <Text position="absolute" :left="32" :top="14" fg="#44FF44" bold :zIndex="20">
        Child B1 (z=20)
      </Text>
      <Box
        position="absolute"
        :left="35"
        :top="15"
        :width="15"
        :height="4"
        backgroundColor="#004400"
        :zIndex="15"
        :border="true"
        borderStyle="single"
        borderColor="#88FF88"
      />
      <Text position="absolute" :left="37" :top="16" fg="#88FF88" :zIndex="15">
        Child B2 (z=15)
      </Text>
    </Box>

    <!-- Group C -->
    <Box position="absolute" :left="0" :top="0" :zIndex="zIndices.c">
      <Box
        position="absolute"
        :left="45"
        :top="16"
        :width="25"
        :height="6"
        backgroundColor="#442200"
        :zIndex="30"
        :border="true"
        borderStyle="rounded"
        borderColor="#FFFF44"
        :title="`Parent C (z=${zIndices.c})`"
        titleAlignment="center"
      />
      <Text position="absolute" :left="47" :top="18" fg="#FFFF44" bold :zIndex="30">
        Child C1 (z=30)
      </Text>
      <Box
        position="absolute"
        :left="50"
        :top="19"
        :width="15"
        :height="4"
        backgroundColor="#444400"
        :zIndex="25"
        :border="true"
        borderStyle="single"
        borderColor="#FFFF88"
      />
      <Text position="absolute" :left="52" :top="20" fg="#FFFF88" :zIndex="25">
        Child C2 (z=25)
      </Text>
    </Box>

    <Text position="absolute" :left="10" :top="25" fg="#AAAAAA" :zIndex="1000">
      Key Concept: Parent z-index determines group layering, child z-index determines order within
      group
    </Text>
    <Text position="absolute" :left="10" :top="26" fg="#AAAAAA" :zIndex="1000">
      Even if Child C1 has z=30, it renders behind Parent A & B because Parent C has z=20
    </Text>

    <Text position="absolute" :left="10" :top="28" fg="#FFFFFF" bold :zIndex="1000">
      Animation Phase: {{ phase + 1 }}/4 - {{ phaseNames[phase] }} (+/- speed:
      {{ animationSpeed }}ms)
    </Text>
    <Text position="absolute" :left="10" :top="29" fg="#FFFFFF" :zIndex="1000">
      Current Z-Indices - A:{{ zIndices.a }}, B:{{ zIndices.b }}, C:{{ zIndices.c }}
    </Text>
  </Box>
</template>
