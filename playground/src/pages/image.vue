<script setup lang="ts">
import { Box, Image, Newline, Text } from 'vue-termui'
import type { ImageData } from 'vue-termui'

type RGB = readonly [number, number, number]

function image(width: number, height: number, paint: (x: number, y: number) => RGB): ImageData {
  const data = new Uint8Array(width * height * 4)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 4
      const [r, g, b] = paint(x, y)
      data[off] = r
      data[off + 1] = g
      data[off + 2] = b
      data[off + 3] = 255
    }
  }

  return { data, width, height }
}

function previewImage(width: number, height: number): ImageData {
  const centerX = (width - 1) / 2
  const centerY = (height - 1) / 2

  return image(width, height, (x, y) => {
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const wave = (Math.sin(distance * 0.95) + 1) / 2

    return [
      Math.round(30 + (x / (width - 1)) * 170),
      Math.round(210 - distance * 8),
      Math.round(90 + wave * 130),
    ]
  })
}

const preview = previewImage(24, 10)
</script>

<template>
  <Box
    flexDirection="column"
    borderStyle="rounded"
    borderColor="#3f7d5c"
    :padding="1"
    :gap="1"
    :width="56"
  >
    <Text bold fg="#42b883">Image Component</Text>
    <Text dim>Single compact RGBA sample rendered through vue-termui Image.</Text>
    <Newline />

    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="#385246"
      :padding="1"
      :gap="1"
      :width="50"
    >
      <Text bold fg="#e8fff3">Preview</Text>
      <Text dim>24 x 10 RGBA pixels</Text>
      <Image :data="preview" />
    </Box>
  </Box>
</template>
