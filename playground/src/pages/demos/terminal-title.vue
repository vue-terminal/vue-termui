<script setup lang="ts">
// Ported from opentui packages/examples/src/terminal-title.ts
import { Box, computed, onKeyDown, ref, Text, useInterval, useTitle } from 'vue-termui'

const titles = ['OpenTUI Test', 'Terminal Title Demo', 'Success!'] as const

// The title cycles through the sequence, one step every 2s, then stays on the
// last one. `useTitle` drives the terminal title reactively and resets it when
// the page unmounts.
const step = ref(0)
const title = computed(() => titles[step.value]!)
useTitle(title)

useInterval(() => {
  if (step.value < titles.length - 1) step.value++
}, 2000)

onKeyDown((key) => {
  if (key.name === 'r') step.value = 0
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Terminal Title</Text>
    <Text>Current terminal title: {{ title }}</Text>
    <Box flexDirection="column">
      <Text
        v-for="(candidate, i) in titles"
        :key="candidate"
        :fg="i === step ? '#7ee787' : '#666666'"
      >
        {{ i === step ? '▶' : ' ' }} {{ candidate }}
      </Text>
    </Box>
    <Text fg="#888888">Watch your terminal window/tab title cycle. Press r to restart.</Text>
    <Text fg="#888888">The title is reset when you leave this page.</Text>
  </Box>
</template>
