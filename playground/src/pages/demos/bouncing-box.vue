<script setup lang="ts">
import { Box, computed, onKeyDown, onUnmounted, reactive, ref, Text, useExit } from 'vue-termui'

// Quit on `q` (in addition to Ctrl+C, handled natively by the renderer).
const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'q') exit()
})

// Terminal size (reactive, updates on resize).
const cols = ref(process.stdout.columns ?? 80)
const rows = ref(process.stdout.rows ?? 24)

// Box size proportional to the terminal, kept small.
const boxWidth = computed(() => Math.max(16, Math.round(cols.value * 0.3)))
const boxHeight = computed(() => Math.max(9, Math.round(rows.value * 0.3)))

// Position + velocity in terminal cells (floats for smooth motion).
const pos = reactive({ x: 2, y: 1 })
const vel = { x: 0.7, y: 0.4 }

const left = computed(() => Math.round(pos.x))
const top = computed(() => Math.round(pos.y))

// Uptime in seconds.
const seconds = ref(0)
const uptime = setInterval(() => {
  seconds.value++
}, 1000)

function onResize() {
  cols.value = process.stdout.columns ?? cols.value
  rows.value = process.stdout.rows ?? rows.value
}
process.stdout.on('resize', onResize)

// Animation loop: move + bounce off the walls.
const timer = setInterval(() => {
  const maxX = Math.max(0, cols.value - boxWidth.value)
  const maxY = Math.max(0, rows.value - boxHeight.value)

  pos.x += vel.x
  pos.y += vel.y

  if (pos.x <= 0) {
    pos.x = 0
    vel.x = Math.abs(vel.x)
  }
  if (pos.x >= maxX) {
    pos.x = maxX
    vel.x = -Math.abs(vel.x)
  }
  if (pos.y <= 0) {
    pos.y = 0
    vel.y = Math.abs(vel.y)
  }
  if (pos.y >= maxY) {
    pos.y = maxY
    vel.y = -Math.abs(vel.y)
  }
}, 1000 / 30)

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(uptime)
  process.stdout.off('resize', onResize)
})
</script>

<template>
  <Box
    position="absolute"
    :left="left"
    :top="top"
    :width="boxWidth"
    :height="boxHeight"
    borderStyle="rounded"
    :padding="1"
    flexDirection="column"
    :gap="1"
  >
    <Text fg="#42b883" bold>vue-termui 👋</Text>
    <Text fg="#888888">Uptime: {{ seconds }}s</Text>
    <Text fg="#888888">Press q or Ctrl+C to exit</Text>
  </Box>
</template>
