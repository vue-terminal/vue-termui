<script setup lang="ts">
import {
  Box,
  useRenderer,
  onKeyDown,
  onKeyUp,
  ref,
  shallowRef,
  Text,
  type KeyEvent,
} from 'vue-termui'

const renderer = useRenderer()
const last = ref('(press any key)')
const lastData = shallowRef<KeyEvent>()
// releases arrive on a separate channel (OpenTUI's `keyrelease`), so they are
// only observable through onKeyUp — onKeyDown never sees eventType 'release'
const lastUp = ref('(waiting for a key release…)')

const keydownCount = ref(0)

onKeyDown((key) => {
  const mods = [
    key.ctrl && 'Ctrl',
    key.meta && 'Meta',
    key.shift && 'Shift',
    key.option && 'Alt',
  ].filter(Boolean)
  lastData.value = key
  keydownCount.value++
  last.value = [...mods, key.name].join('+')
})

onKeyUp((key) => {
  lastUp.value = `${key.name} (source: ${key.source}, eventType: ${key.eventType})`
  lastData.value = key
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883"
      >Keyboard (onKeyDown x{{ keydownCount }}). Kitty protocol support:
      {{ renderer.capabilities?.kitty_keyboard }}</Text
    >
    <Text>Last key: {{ last }}</Text>
    <Text>{{ lastData }}</Text>
    <Text>Last release (onKeyUp): {{ lastUp }}</Text>
    <Text fg="#888888">Releases only arrive for escape-coded keys — try holding an arrow key.</Text>
    <Text fg="#888888">Modifiers are shown too. This also drives the sidebar</Text>
    <Text fg="#888888">while it holds focus — press Esc to focus the nav.</Text>
  </Box>
</template>
