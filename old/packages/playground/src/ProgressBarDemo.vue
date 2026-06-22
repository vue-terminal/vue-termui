<script setup lang="ts">
const progress = ref(50)
useInterval(() => {
  progress.value < 100 && progress.value++
}, 0)
</script>

<template>
  <Text>
    <Newline :n="2" />
    <ProgressBar :value="progress" color="green" :width="12" />
    <Newline :n="2" />
    <ProgressBar :value="progress" color="yellow" />
    <Newline :n="2" />
    <ProgressBar :value="progress" color="blue" :width="50" />
    <Newline :n="2" />
  </Text>
</template>
