<script setup lang="ts">
import { Box, ref, Select, Text } from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const options: SelectOption[] = [
  { name: 'New File', description: 'Create a new file' },
  { name: 'Open File', description: 'Open an existing file' },
  { name: 'Close File', description: 'Close the current file' },
  { name: 'Undo', description: 'Undo last action' },
  { name: 'Redo', description: 'Redo last undone action' },
  { name: 'Copy', description: 'Copy selected text' },
  { name: 'Paste', description: 'Paste from clipboard' },
  { name: 'Cut', description: 'Cut selected text' },
  { name: 'Find', description: 'Find text in the file' },
  { name: 'Replace', description: 'Replace text in the file' },
  { name: 'Save', description: 'Save current file' },
  { name: 'Exit', description: 'Exit the application' },
]

const index = ref(0)
const chosen = ref('')
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Select (v-model)</Text>
    <!-- Autofocus so ↑/↓ drive the list; Esc returns focus to the sidebar. -->
    <Select
      v-model="index"
      :options="options"
      focus
      :showDescription="false"
      width="30%"
      :height="6"
      @select="(option) => (chosen = option?.name ?? '')"
    />
    <Text>Highlighted: {{ options[index]?.name }}</Text>
    <Text v-if="chosen" fg="#42b883">Selected: {{ chosen }} 🎉</Text>
  </Box>
</template>
