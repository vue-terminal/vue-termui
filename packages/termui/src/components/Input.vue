<script setup lang="ts">
import { getCurrentInstance, onMounted } from '@vue/runtime-core'

const instance = getCurrentInstance()

console.log(!!instance)
debugger

onMounted(() => {
  console.log(!!instance)
  debugger
})
</script>

<template>
  <TuiText dimmed>Label: </TuiText>
  <TuiText>value</TuiText>
</template>
