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
import { GlobalEvents } from './components/GlobalEvents'

const [cols, rows] = useStdoutDimensions()

const n = ref(0)
const disabled = ref(0)
onKeyData(['d', 'D'], () => {
  disabled.value = (disabled.value + 1) % 4
})
useInterval(() => {
  n.value++
  // write(`n: ${n.value}\n`)
}, 300)
useTitle(computed(() => `Counting ${n.value}...`))
</script>

<template>
  <Div
    :width="cols"
    :height="rows"
    justifyContent="center"
    flexDirection="column"
    alignItems="center"
    borderStyle="round"
    title="Focusables"
  >
    <GlobalEvents
      @keypress.+.right.up="disabled++"
      @keypress.-.left.down="disabled--"
    />
    <Link href="https://esm.dev">My Website</Link>
    <Text underline>Cannot be focused</Text>
    <Link
      v-for="i in 4"
      :href="`https://esm.dev/labs/${i - 1}`"
      :disabled="disabled === i - 1"
      >Lab {{ i }}{{ disabled === i - 1 ? ' (disabled)' : '' }}</Link
    >
  </Div>
</template>
