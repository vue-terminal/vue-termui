<script setup lang="ts">
// Ported from @opentui/examples src/opacity-example.ts
import { Box, onKeyDown, reactive, ref, Text, useInterval } from 'vue-termui'

const boxes = reactive([
  { label: 'Box 1', color: '#e94560', opacity: 1.0 },
  { label: 'Box 2', color: '#0f3460', opacity: 0.8 },
  { label: 'Box 3', color: '#533483', opacity: 0.5 },
  { label: 'Box 4', color: '#16a085', opacity: 0.3 },
])

const animating = ref(false)
let phase = 0
useInterval(() => {
  if (!animating.value) return
  phase += 0.05
  for (const [i, box] of boxes.entries()) {
    box.opacity = 0.3 + 0.7 * Math.abs(Math.sin(phase + i * 0.5))
  }
}, 50)

onKeyDown((key) => {
  const i = ['1', '2', '3', '4'].indexOf(key.name)
  const box = boxes[i]
  if (box) {
    box.opacity = box.opacity === 1 ? 0.3 : 1
  } else if (key.name === 'a') {
    animating.value = !animating.value
  }
})
</script>

<template>
  <Box flexDirection="column" :flexGrow="1" backgroundColor="#1a1a2e">
    <Box
      :height="3"
      backgroundColor="#16213e"
      borderStyle="single"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#e94560">
        {{
          animating
            ? 'OPACITY DEMO | Animating… | A: Stop'
            : 'OPACITY DEMO | 1-4: Toggle opacity | A: Animate'
        }}
      </Text>
    </Box>

    <Box :flexGrow="1" flexDirection="row" alignItems="center" justifyContent="center" :padding="2">
      <Box
        v-for="(box, i) of boxes"
        :key="box.label"
        position="absolute"
        :left="10 + i * 8"
        :top="5 + i * 2"
        :width="20"
        :height="8"
        :backgroundColor="box.color"
        borderStyle="double"
        borderColor="#ffffff"
        :opacity="box.opacity"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        <Text fg="#ffffff">{{ box.label }}</Text>
        <Text fg="#ffffff">Opacity: {{ box.opacity.toFixed(1) }}</Text>
      </Box>

      <!-- Nested opacity: the child multiplies with its parent -->
      <Box
        position="absolute"
        :right="5"
        :top="5"
        :width="35"
        :height="10"
        backgroundColor="#e94560"
        borderStyle="single"
        :opacity="0.7"
        :padding="1"
        flexDirection="column"
      >
        <Text fg="#ffffff">Parent: 0.7 opacity</Text>
        <Box
          :height="5"
          backgroundColor="#0f3460"
          borderStyle="single"
          :opacity="0.5"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
        >
          <Text fg="#ffffff">Child: 0.5 opacity</Text>
          <Text fg="#ffcc00">Effective: 0.35</Text>
        </Box>
      </Box>
    </Box>
  </Box>
</template>
