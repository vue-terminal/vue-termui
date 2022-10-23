<script setup lang="ts">
import { ref } from 'vue-termui'
const progress = ref(50)
const interval = setInterval(() => {
  progress.value += 1
  if (progress.value > 100) {
    clearInterval(interval)
  }
}, 0)
</script>

<template>
  <Text>
    <Newline :n="2" />
    <ProgressBar v-model="progress" color="green" />
    <Newline :n="2" />
    <ProgressBar v-model="progress" color="yellow" />
    <Newline :n="2" />
    <ProgressBar v-model="progress" color="blue" />
    <Newline :n="2" />
  </Text>
</template>
