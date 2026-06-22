<script setup lang="ts">
import { onKeyData, ref, TuiInput as MyInput } from 'vue-termui'

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
