<script setup lang="ts">
import { Box, onKeyDown, ref, Text } from 'vue-termui'

const last = ref('(press any key)')

onKeyDown((key) => {
  const mods = [
    key.ctrl && 'Ctrl',
    key.meta && 'Meta',
    key.shift && 'Shift',
    key.option && 'Alt',
  ].filter(Boolean)
  last.value = [...mods, key.name].join('+')
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Keyboard (onKeyDown)</Text>
    <Text>Last key: {{ last }}</Text>
    <Text fg="#888888">Modifiers are shown too. This also drives the sidebar</Text>
    <Text fg="#888888">while it holds focus — press Esc to focus the nav.</Text>
  </Box>
</template>
