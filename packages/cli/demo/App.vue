<script setup lang="ts">
import type { Boxes } from 'cli-boxes'
import type { ForegroundColor } from 'chalk'
import { TuiBox as Box, ref, onMounted } from 'vue-termui'

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

const colors: Array<ForegroundColor> = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'gray',
  'grey',
  'blackBright',
  'redBright',
  'greenBright',
  'yellowBright',
  'blueBright',
  'magentaBright',
  'cyanBright',
  'whiteBright',
]

const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
  <Box
    :borderStyle="styles[n % styles.length]"
    :borderColor="colors[n % colors.length]"
    :marginX="0"
    :paddingX="1"
    width="100%"
    :maxWidth="80"
    color="red"
  >
    <Span
      >Counter: <span bold>{{ n }}</span
      >.
      <Br />
      <span color="blue"
        >is it Odd?
        <span :inverse="n % 2 == 0">
          {{ n % 2 == 0 ? 'No' : 'Yes' }}
        </span>
      </span>
      <Br />
      <Span color="yellow">Current style: {{ styles[n % styles.length] }}</Span>
    </Span>
  </Box>
</template>
