<script setup lang="ts">
import type { TextChunk } from '@opentui/core'
import { bold, fg, StyledText } from '@opentui/core'
import { Box, computed, onUnmounted, ref, Text } from 'vue-termui'
import { buildFrames, type Seg, WHITE } from './logo-frames'

const FRAME_MS = 80

function toStyled(segs: Seg[]): StyledText {
  return new StyledText(
    segs.map((seg) => {
      let chunk: TextChunk = fg(seg.color ?? WHITE)(seg.text)
      if (seg.bold) chunk = bold(chunk)
      return chunk
    }),
  )
}

const frames = buildFrames().map((frame) => frame.map(toStyled))

const frame = ref(0)
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function play() {
  clearInterval(timer)
  paused.value = false
  timer = setInterval(() => {
    if (frame.value < frames.length - 1) {
      frame.value++
    } else {
      clearInterval(timer)
    }
  }, FRAME_MS)
}

function replay() {
  frame.value = 0
  play()
}

function togglePause() {
  if (paused.value) {
    play()
  } else {
    clearInterval(timer)
    paused.value = true
  }
}

/** Moves `delta` frames (clamped) and pauses playback. */
function step(delta: number) {
  clearInterval(timer)
  paused.value = true
  frame.value = Math.min(Math.max(frame.value + delta, 0), frames.length - 1)
}

play()
onUnmounted(() => clearInterval(timer))

defineExpose({ replay, togglePause, step })

const lines = computed(() => frames[frame.value]!)
</script>

<template>
  <Box
    flexDirection="column"
    borderStyle="double"
    borderColor="#42b883"
    :width="20"
    :height="8"
    :paddingX="1"
    justifyContent="center"
    alignItems="flex-start"
  >
    <Text v-for="(line, i) in lines" :key="i" :content="line" />
  </Box>
</template>
