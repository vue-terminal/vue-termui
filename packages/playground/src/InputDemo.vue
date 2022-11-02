<script setup lang="ts">
const value = ref('')
const isFocus = ref(true)
const value1 = ref('')
const isFocus1 = ref(false)

watch(value, (v: string) => {
  if (v === 'hello') {
    isFocus.value = false
    isFocus1.value = true
  }
})
</script>

<template borderStyle="round">
  <Input v-model="value" :focus="isFocus" />
  <Input v-model="value1" :focus="isFocus1" type="password" />
</template>
