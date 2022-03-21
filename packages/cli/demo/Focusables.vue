<script setup lang="ts">
import { ref, reactive, MouseDataEvent, MouseEventType } from 'vue-termui'
import Input from './Input.vue'

const n = ref(0)
const disabled = ref(0)
onKeyData(['d', 'D'], () => {
  disabled.value = (disabled.value + 1) % 4
})
setInterval(() => {
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
    <Link href="https://esm.dev">My Website</Link>
    <Text underline>Cannot be focused</Text>
    <Link
      v-for="i in 4"
      :href="`https://esm.dev/labs/${i - 1}`"
      :disabled="disabled === i - 1"
      >Lab {{ i }}</Link
    >
  </Div>
</template>
