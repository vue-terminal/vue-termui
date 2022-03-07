<script setup lang="ts">
import { ref, onMounted } from 'vue-termui'

const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1)
})
</script>

<template>
  <span color="green"
    ><span bold>✔ {{ n }}</span> tests passed</span
  >
</template>
