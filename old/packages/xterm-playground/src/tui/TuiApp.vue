<script setup lang="ts">
import { Boxes } from 'cli-boxes'
import { TuiBox as Box, ref, onMounted } from 'vue-termui'

const n = ref(0)
const styles: Array<keyof Boxes> = [
  'arrow',
  'bold',
  'classic',
  'double',
  'doubleSingle',
  'round',
  'single',
  'singleDouble',
]
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
  <Box
    :borderStyle="styles[n % styles.length]"
    :marginX="0"
    :paddingX="1"
    width="100%"
    :maxWidth="80"
    color="red"
  >
    <span
      >Counter: <span bold>{{ n }}</span
      >.
      <br />
      <span color="blue"
        >is it Odd?
        <span :inverse="n % 2 == 0">
          {{ n % 2 == 0 ? 'No' : 'Yes' }}
        </span>
      </span>
      <br />
      <Span color="yellow">Current style: {{ styles[n % styles.length] }}</Span>
    </span>
  </Box>
</template>
