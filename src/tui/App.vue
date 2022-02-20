<script setup lang="ts">
const n = ref(0)

const log = useLog()

onMounted(() => {
  log('mounted!')
  setInterval(() => {
    n.value++
  }, 1000)
})

onUnmounted(() => {
  const instance = getCurrentInstance()
  log('removed:', JSON.stringify(instance?.vnode.el, null, 2))
})
</script>

<template>Counter: {{ n }}</template>
