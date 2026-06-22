<script setup lang="ts">
import {
  ref,
  reactive,
  MouseDataEvent,
  MouseEventType,
  useStdoutDimensions,
  useTitle,
} from 'vue-termui'
import Input from './Input.vue'

const [cols, rows] = useStdoutDimensions()

const disabled = ref(1)
onKeyData(['d', 'D'], () => {
  disabled.value = (disabled.value + 1) % 4
})
</script>

<template>
  <Box
    :width="cols"
    :height="30"
    justifyContent="center"
    flexDirection="column"
    alignItems="center"
    borderStyle="round"
    title="Focusables"
  >
    <Text underline>Cannot be focused</Text>
    <Box title="Other stuff" borderStyle="round">
      <Text>I am just some text</Text>
    </Box>
    <Box title="Focused here" flexDirection="column" borderStyle="round">
      <Link
        v-for="i in 4"
        :href="`https://esm.dev/labs/${i - 1}`"
        :disabled="disabled !== i - 1"
        >Lab {{ i }}{{ disabled !== i - 1 ? ' (disabled)' : '' }}</Link
      >
      <Link href="https://example.com">Another one</Link>
    </Box>
  </Box>
</template>
