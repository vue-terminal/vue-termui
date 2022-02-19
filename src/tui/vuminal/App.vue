<script setup lang="ts">
import { ref, onMounted } from 'vuminal'
const n = ref(0)

onMounted(() => {
  console.log('mounted!')
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>Vuminal Counter: {{ n }}</template>
