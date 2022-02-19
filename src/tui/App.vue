<script setup lang="ts">
const n = ref(0)

onMounted(() => {
  console.log('mounted!')
  setInterval(() => {
    n.value++
  }, 1000)
})

onUnmounted(() => {
  console.log('removed')
})
</script>

<template>Counter: {{ n }}</template>
