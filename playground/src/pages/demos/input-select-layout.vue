<script setup lang="ts">
// Ported from @opentui/examples src/input-select-layout-demo.ts (flexbox layout with selects + input)
import { Box, computed, Input, ref, Select, Text } from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const colorOptions: SelectOption[] = [
  { name: 'Red', description: 'A warm primary color', value: '#ff0000' },
  { name: 'Blue', description: 'A cool primary color', value: '#0066ff' },
  { name: 'Green', description: 'A natural color', value: '#00aa00' },
  { name: 'Purple', description: 'A regal color', value: '#8a2be2' },
  { name: 'Orange', description: 'A vibrant color', value: '#ff8c00' },
  { name: 'Teal', description: 'A calming color', value: '#008080' },
]

const sizeOptions: SelectOption[] = [
  { name: 'Small', description: 'Compact size (8px)', value: 8 },
  { name: 'Medium', description: 'Standard size (12px)', value: 12 },
  { name: 'Large', description: 'Big size (16px)', value: 16 },
  { name: 'Extra Large', description: 'Huge size (20px)', value: 20 },
]

const colorIndex = ref(0)
const sizeIndex = ref(0)
const text = ref('')

const displayText = computed(() => {
  let display = 'Enter your text:'
  if (text.value) display += ` "${text.value}"`
  const color = colorOptions[colorIndex.value]
  if (color) display += ` in ${color.name}`
  const size = sizeOptions[sizeIndex.value]
  if (size) display += ` (${size.name})`
  return display
})
</script>

<template>
  <Box flexDirection="column" width="100%" height="100%">
    <Box
      width="100%"
      :height="3"
      backgroundColor="#3b82f6"
      borderStyle="single"
      borderColor="#2563eb"
      :flexGrow="0"
      :flexShrink="0"
    >
      <Text fg="#ffffff">INPUT & SELECT LAYOUT DEMO</Text>
    </Box>
    <Box
      width="100%"
      :flexGrow="1"
      :flexShrink="1"
      :minHeight="10"
      flexDirection="row"
      backgroundColor="#1e293b"
      borderStyle="single"
      borderColor="#475569"
    >
      <Box
        :flexGrow="1"
        :flexShrink="1"
        :minHeight="8"
        borderStyle="single"
        borderColor="#475569"
        focusedBorderColor="#3b82f6"
        title="Color Selection"
        titleAlignment="center"
      >
        <Select
          v-model="colorIndex"
          :options="colorOptions"
          autofocus
          width="100%"
          :minHeight="6"
          :flexGrow="1"
          backgroundColor="#1e293b"
          focusedBackgroundColor="#2d3748"
          textColor="#e2e8f0"
          focusedTextColor="#f7fafc"
          selectedBackgroundColor="#3b82f6"
          selectedTextColor="#ffffff"
          descriptionColor="#94a3b8"
          selectedDescriptionColor="#cbd5e1"
          showScrollIndicator
          wrapSelection
          showDescription
        />
      </Box>
      <Box
        :flexGrow="1"
        :flexShrink="1"
        :minHeight="8"
        borderStyle="single"
        borderColor="#475569"
        focusedBorderColor="#059669"
        title="Size Selection"
        titleAlignment="center"
      >
        <Select
          v-model="sizeIndex"
          :options="sizeOptions"
          width="100%"
          :minHeight="6"
          :flexGrow="1"
          backgroundColor="#1e293b"
          focusedBackgroundColor="#2d3748"
          textColor="#e2e8f0"
          focusedTextColor="#f7fafc"
          selectedBackgroundColor="#059669"
          selectedTextColor="#ffffff"
          descriptionColor="#94a3b8"
          selectedDescriptionColor="#cbd5e1"
          showScrollIndicator
          wrapSelection
          showDescription
        />
      </Box>
    </Box>
    <Box
      width="100%"
      :height="7"
      :flexGrow="0"
      :flexShrink="0"
      flexDirection="column"
      backgroundColor="#0f172a"
      borderStyle="single"
      borderColor="#334155"
    >
      <Text fg="#f1f5f9" bg="#0f172a">{{ displayText }}</Text>
      <Box
        width="100%"
        :height="3"
        :marginTop="1"
        borderStyle="single"
        borderColor="#475569"
        focusedBorderColor="#eab308"
      >
        <Input
          v-model="text"
          width="100%"
          placeholder="Type something here..."
          backgroundColor="#1e293b"
          focusedBackgroundColor="#334155"
          textColor="#f1f5f9"
          focusedTextColor="#ffffff"
          placeholderColor="#64748b"
          cursorColor="#f1f5f9"
          :maxLength="100"
        />
      </Box>
    </Box>
    <Box
      width="100%"
      :height="3"
      :flexGrow="0"
      :flexShrink="0"
      backgroundColor="#1e40af"
      borderStyle="single"
      borderColor="#1d4ed8"
    >
      <Text fg="#dbeafe"
        >TAB: focus next | SHIFT+TAB: focus prev | ARROWS/JK: navigate | ESC: focus sidebar</Text
      >
    </Box>
  </Box>
</template>
