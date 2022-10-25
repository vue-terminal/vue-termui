<script setup lang="ts">
const value = ref('')
const visible = ref(false)
function submit() {
  visible.value = true
}
</script>

<template borderStyle="round">
  <Input
    v-model="value"
    placeholder="Hello World"
    @submit="submit"
    type="password"
  />
  <Text v-if="visible">Value:{{ value }}</Text>
</template>
