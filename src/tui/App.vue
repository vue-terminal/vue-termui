<script setup lang="ts">
import { ref, onMounted } from './renderer'
const n = ref(0)

onMounted(() => {
  console.log('mounted!')
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>Counter: {{ n }}</template>
