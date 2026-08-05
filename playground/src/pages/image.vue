<script setup lang="ts">
import { fileURLToPath } from 'node:url'
import { Box, decodeImage, Image, ref, TabSelect, Text } from 'vue-termui'
import type { ImageData, TabSelectOption } from 'vue-termui'

const imagePath = fileURLToPath(new URL('../assets/sprites/ClaudeCode.png', import.meta.url))

const TAB_WIDTH = 9

// TabSelectRenderable left-aligns labels; pad with spaces to center them
// within the tab (content area = tabWidth - 2).
const center = (label: string) => ' '.repeat(Math.floor((TAB_WIDTH - 2 - label.length) / 2)) + label

const tabs: TabSelectOption[] = [
  { name: center('Block'), description: '1×2 px per cell (character rendering)' },
  { name: center('Kitty'), description: 'kitty graphics protocol (real pixels)' },
  { name: center('Sixel'), description: 'sixel protocol (real pixels)' },
]
const tab = ref(0)

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
    :width="60"
  >
    <Box flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text bold fg="#42b883">Image Component</Text>

      <!-- ‹ › hint that ←/→ switches tabs; Kitty/Sixel are placeholders -->
      <Box flexDirection="row" alignItems="center">
        <Text dim>‹</Text>
        <TabSelect
          v-model="tab"
          :options="tabs"
          autofocus
          :width="TAB_WIDTH * 3"
          :tabWidth="TAB_WIDTH"
          textColor="#a0a0a0"
          :showDescription="false"
          :showUnderline="false"
          selectedTextColor="#42b883"
          selectedBackgroundColor="#2c3e50"
          focusedBackgroundColor="#1a1a1a"
        />
        <Text dim>›</Text>
      </Box>
    </Box>

    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="#385246"
      :padding="1"
      :gap="1"
      :width="56"
    >
      <Text v-if="tab === 0" dim>{{ status }}</Text>
      <Image v-if="tab === 0 && preview" :data="preview" />
      <Text v-if="tab === 1" dim>Kitty graphics protocol — under development</Text>
      <Text v-if="tab === 2" dim>Sixel protocol — under development</Text>
    </Box>
  </Box>
</template>
