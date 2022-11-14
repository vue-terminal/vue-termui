<script setup lang="ts">
import { onKeyData, ref } from 'vue-termui'
import MyInput from './components/Input.vue'

const msg = ref('Hello World')

const disabled = ref(false)
onKeyData(['d', 'D'], () => {
  disabled.value = !disabled.value
})
</script>

<template borderStyle="round">
  <Text bold>{{ msg }}</Text>
  <MyInput label="Enter a message: " v-model="msg" :disabled="disabled" />
  <MyInput type="password" />
</template>
