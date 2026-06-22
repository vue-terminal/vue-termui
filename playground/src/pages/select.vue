<script setup lang="ts">
import { Box, ref, Select, Text } from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const options: SelectOption[] = [
  { name: 'Vue', description: 'The progressive framework' },
  { name: 'OpenTUI', description: 'Native terminal renderer' },
  { name: 'vue-termui', description: 'Vue 3 in the terminal' },
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
      :showDescription="true"
      focus
      @select="(option) => (chosen = option?.name ?? '')"
    />
    <Text>Highlighted: {{ options[index]?.name }}</Text>
    <Text v-if="chosen" fg="#42b883">Selected: {{ chosen }} 🎉</Text>
  </Box>
</template>
