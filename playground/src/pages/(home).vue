<script setup lang="ts">
import { Box, Text, useTerminalSize } from 'vue-termui'
import VueTermUILogo from '../components/VueTermUILogo.vue'

const { width, height } = useTerminalSize()
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <VueTermUILogo />
    <Text bold fg="#42b883">Welcome to vue-termui 👋</Text>
    <Text>Build terminal apps with Vue 3, rendered by OpenTUI.</Text>
    <Text fg="#888888">Use the sidebar (↑/↓ then ⏎) to explore the demos.</Text>
    <Text fg="#888888">Terminal size: {{ width }}×{{ height }} (resizes live)</Text>
  </Box>
</template>
