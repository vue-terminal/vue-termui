<script setup lang="ts">
import { Box, computed, Input, onKeyDown, ProgressBar, ref, Text, useExit } from 'vue-termui'

// Escape or Ctrl+C to quit. `q` is intentionally NOT a quit key here — it would
// fire while typing it into the input (global key listeners see every press).
const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'escape') exit()
})

const name = ref('')
const max = 20
const filled = computed(() => Math.min(name.value.length, max))
</script>

<template>
  <Box flexDirection="column" :padding="1" :gap="1" borderStyle="rounded">
    <Text fg="#42b883" bold>What is your name?</Text>
    <Input v-model="name" placeholder="Type here…" focus :maxLength="max" />
    <Box flexDirection="row" :gap="1">
      <ProgressBar :value="filled" :max="max" :width="max" />
      <Text fg="#888888">{{ filled }}/{{ max }}</Text>
    </Box>
    <Text v-if="name">Hello, {{ name }}! 👋</Text>
    <Text fg="#888888">Esc or Ctrl+C to exit</Text>
  </Box>
</template>
