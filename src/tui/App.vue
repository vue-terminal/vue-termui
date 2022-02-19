<script setup lang="ts">
import { ref, onMounted, onUnmounted } from './renderer'
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
