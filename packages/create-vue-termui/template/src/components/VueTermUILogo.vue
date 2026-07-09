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
let timer: ReturnType<typeof setInterval> | undefined

function replay() {
  clearInterval(timer)
  frame.value = 0
  timer = setInterval(() => {
    if (frame.value < frames.length - 1) {
      frame.value++
    } else {
      clearInterval(timer)
    }
  }, FRAME_MS)
}

replay()
onUnmounted(() => clearInterval(timer))

defineExpose({ replay })

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
