<script setup lang="ts">
import { Box, Image, Newline, Text } from 'vue-termui'

// Generate a test checkerboard pattern (no external image needed).
function checkerboard(
  cellSize: number,
  cols: number,
  rows: number,
  c1: [number, number, number],
  c2: [number, number, number],
) {
  const w = cellSize * cols
  const h = cellSize * rows
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const off = (y * w + x) * 4
      const [r, g, b] = (Math.floor(x / cellSize) + Math.floor(y / cellSize)) % 2 === 0 ? c1 : c2
      data[off] = r; data[off + 1] = g; data[off + 2] = b; data[off + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

function gradient(w: number, h: number) {
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const off = (y * w + x) * 4
      data[off] = Math.round(255 * x / (w - 1))
      data[off + 1] = Math.round(255 * (1 - y / (h - 1)))
      data[off + 2] = 128
      data[off + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

const pattern = checkerboard(4, 8, 4, [0, 200, 100], [20, 40, 20])
const rainbow = gradient(16, 8)
</script>

<template>
  <Box flexDirection="column" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Image</Text>
    <Newline />
    <Text dim>Checkerboard (32×16 px):</Text>
    <Image :data="pattern" />
    <Newline />
    <Text dim>Gradient (16×8 px):</Text>
    <Image :data="rainbow" />
    <Newline />
    <Text dim>
      Terminal supports Kitty/Sixel/SGR? → native pixels.
      Otherwise → grayscale half-block fallback.
    </Text>
  </Box>
</template>
