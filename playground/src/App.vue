<script setup lang="ts">
import { onUnmounted, ref } from 'vue-termui'

const seconds = ref(0)
const timer = setInterval(() => {
  seconds.value++
}, 1000)
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <box borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
    <text fg="#42b883">Hello, vue-termui 👋</text>
    <text fg="#35495e">Rendered from an App.vue with a Vue custom renderer</text>
    <text fg="#888888">Uptime: {{ seconds }}s</text>
    <text fg="#888888">Press Ctrl+C to exit</text>
  </box>
</template>
