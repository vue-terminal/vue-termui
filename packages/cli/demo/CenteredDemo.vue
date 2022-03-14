<script setup lang="ts">
import {
  TuiBox as Box,
  TuiText as Text,
  TuiLink as Link,
  ref,
  onMounted,
  onMouseEvent,
  onInput,
  onKeypress,
  reactive,
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

onMouseEvent(0, (event) => {
  // pressData.value = `MB${event.button}: ${event.clientX}x${event.clientY}`
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

const mousetype = {
  0: 'mousedown',
  1: 'mousemove',
  2: 'mouseup',
}

const pressData = ref({})
const position = reactive({ x: 1, y: 1 })
onInput((data) => {
  const escapedSeq = data.input.split('').map(displayableChar).join('')
  lastPress.value = data.key!
  pressData.value = { ...data, input: escapedSeq }
  if ('clientX' in data) {
    position.x = data.clientX - 1
    position.y = data.clientY - 1
  }
})
</script>

<template>
  <Box
    width="100%"
    :height="20"
    justifyContent="center"
    flexDirection="column"
    alignItems="center"
    borderStyle="round"
    @keypress.h="n++"
  >
    <Box>
      <Text>
        <br />
        <Text>Last Keypress "{{ lastPress }}"</Text>
        <br />
      </Text>
    </Box>
    <Box
      :width="40"
      :height="10"
      position="absolute"
      :top="position.y"
      :left="position.x"
    >
      <Text bold
        >Mouse button: {{ pressData.button }} ({{
          mousetype[pressData._type]
        }}): {{ position.x }}x{{ position.y }}</Text
      >
    </Box>
  </Box>
</template>
