<script setup lang="ts">
import { onMounted } from 'vue'
import { Terminal } from 'xterm'
import { createApp } from 'vue-termui'
import TuiApp from './tui/TuiApp.vue'

onMounted(() => {
  const term = new Terminal()
  term.open(document.getElementById('terminal')!)
  // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')

  createApp(TuiApp, {
    // @ts-expect-error: still not correct types
    stdout: term,
  }).mount()
})
</script>

<template>
  <h1>Vue termui + xterm</h1>

  <div id="terminal"></div>
</template>

<style></style>
