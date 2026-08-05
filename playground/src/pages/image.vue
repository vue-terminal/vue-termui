<script setup lang="ts">
import { fileURLToPath } from 'node:url'
import { Box, decodeImage, Image, Newline, ref, Text } from 'vue-termui'
import type { ImageData } from 'vue-termui'

const imagePath = fileURLToPath(new URL('../assets/sprites/ClaudeCode.png', import.meta.url))

// Fit the source into the inner box width; decodeImage resizes (aspect kept)
// and flattens transparency onto white by default.
const TARGET_WIDTH = 46

const preview = ref<ImageData | null>(null)
const status = ref('Decoding image…')

decodeImage(imagePath, { width: TARGET_WIDTH })
  .then((img) => {
    preview.value = img
    status.value = `${img.width} x ${img.height} RGBA pixels`
  })
  .catch((err) => {
    status.value = `Failed to decode: ${err instanceof Error ? err.message : String(err)}`
  })
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
    <Text dim>ClaudeCode.png decoded and resized with jimp.</Text>
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
      <Text dim>{{ status }}</Text>
      <Image v-if="preview" :data="preview" />
    </Box>
  </Box>
</template>
