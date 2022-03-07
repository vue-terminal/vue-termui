<script setup lang="ts">
import type { Boxes } from 'cli-boxes'
import type { ForegroundColor } from 'chalk'
import { TuiBox as Box, ref, onMounted } from 'vue-termui'
import Counter from './Counter.vue'

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
    width="100%"
    justifyContent="flex-end"
    :height="20"
    alignItems="flex-end"
    borderStyle="round"
  >
    <Box
      :borderStyle="styles[n % styles.length]"
      :borderColor="colors[n % colors.length]"
      :marginX="2"
      :paddingX="1"
      width="100%"
      :minHeight="5"
      :maxHeight="8"
      :maxWidth="75"
      justifyContent="flex-start"
      position="relative"
    >
      <Span dimmed>
        <template v-if="n % 2">
          <Counter />.
          <Br />
        </template>
        <span color="blue"
          >is it Odd?
          <span :inverse="n % 3 == 0">
            {{ n % 2 == 0 ? 'No' : 'Yes' }}
          </span>
        </span>
        <Br :n="2" />
        <Span :dimmed="false"
          >Current style: {{ styles[n % styles.length] }}</Span
        >
      </Span>
    </Box>
    <Box
      borderStyle="bold"
      alignSelf="auto"
      :minWidth="34"
      width="50%"
      :maxWidth="50"
      :paddingX="2"
    >
      <Span>
        <template v-if="n % 2">
          <Counter />.
          <Br />
        </template>
        <span color="blue"
          >is it Odd?
          <span :inverse="n % 3 == 0">
            {{ n % 2 == 0 ? 'No' : 'Yes' }}
          </span>
        </span>
        <Br :n="2" />
        <Span>Current style: {{ styles[n % styles.length] }}</Span>
      </Span>
    </Box>
  </Box>
</template>
