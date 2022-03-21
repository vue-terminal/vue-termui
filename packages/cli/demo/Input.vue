<script setup lang="ts">
import { getCurrentInstance, onMounted } from 'vue-termui'

const instance = getCurrentInstance()

// console.log(!!instance)
// debugger

onMounted(() => {
  console.log(!!instance)
  // debugger
})
</script>

<template borderStyle="round">
  <Text dimmed>Label </Text><Text>the value</Text>
</template>
