<script setup lang="ts">
import { Box, onKeyDown, Text, useTemplateRef, useTerminalSize } from 'vue-termui'
import VueTermUILogo from '../components/VueTermUILogo.vue'

const { width, height } = useTerminalSize()

const logo = useTemplateRef<InstanceType<typeof VueTermUILogo>>('logo')

onKeyDown((event) => {
  if (event.name === 'r') {
    logo.value?.replay()
  } else if (event.name === 'space') {
    logo.value?.togglePause()
  } else if (event.name === 'left') {
    logo.value?.step(-1)
  } else if (event.name === 'right') {
    logo.value?.step(1)
  }
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <VueTermUILogo ref="logo" />
    <Text bold fg="#42b883">Welcome to vue-termui 👋</Text>
    <Text>Build terminal apps with Vue 3, rendered by OpenTUI.</Text>
    <Text fg="#888888">Use the sidebar (↑/↓ then ⏎) to explore the demos.</Text>
    <Text fg="#888888">Logo animation: r replay · space pause · ←/→ step frames.</Text>
    <Text fg="#888888">Terminal size: {{ width }}×{{ height }} (resizes live)</Text>
  </Box>
</template>
