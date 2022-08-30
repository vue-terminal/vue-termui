<script setup lang="ts">
import { ref, reactive, MouseDataEvent, MouseEventType } from 'vue-termui'
import Input from './Input.vue'

const n = ref(0)
useInterval(() => {
  n.value++
}, 300)
</script>

<template>
  <Div
    width="100%"
    :height="20"
    justifyContent="center"
    flexDirection="column"
    alignItems="center"
    borderStyle="round"
  >
    <Text>Hey</Text>
    <Input />
    <Text>Other</Text>
    <Text>{{ n }}</Text>
  </Div>
</template>
