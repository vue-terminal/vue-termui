<script setup lang="ts">
import {
  TuiBox as Box,
  TuiText as Text,
  TuiLink as Link,
  ref,
  onMounted,
  onKeypress,
} from 'vue-termui'

const n = ref(0)

onKeypress(['A', 'a'], (event) => {
  n.value++
})
onKeypress('+', (event) => {
  n.value++
})

onKeypress((event) => {
  event.key === 'ArrowDown'
})

const lastPress = ref('')
function displayableChar(c: string) {
  const i = c.charCodeAt(0)
  if (
    // Ansi readable characters
    i >= 0x20 &&
    i <= 0x84 &&
    i !== 0x7f &&
    i !== 0x83
  ) {
    return c
  }

  if (i <= 0xff) {
    return `\\x${i.toString(16).padStart(2, '0')}`
  } else {
    return `\\u${i.toString(16).padStart(4, '0')}`
  }
}
const pressData = ref()
onKeypress((data) => {
  const escapedSeq = data.input.split('').map(displayableChar).join('')
  lastPress.value = data.key!
  pressData.value = { ...data, input: escapedSeq }
})
</script>

<template>
  <Box
    width="100%"
    :height="20"
    justifyContent="center"
    alignItems="center"
    borderStyle="round"
    @keypress.h="n++"
  >
    <Text>
      <Text color="cyanBright" bold>Hello World {{ n }}</Text>
      <Br />
      <Text>Full HMR support!</Text>
      <br />
      <Text>Last Keypress "{{ lastPress }}"</Text>
      <br />
      <Text bold>{{ pressData }}</Text>
    </Text>
  </Box>
</template>
