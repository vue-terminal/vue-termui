<script setup lang="ts">
const progress = ref(50)
useInterval(() => {
  progress.value < 100 && progress.value++
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
