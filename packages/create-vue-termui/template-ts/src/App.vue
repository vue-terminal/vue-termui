<script lang="ts" setup>
// All imports are automatic but if you want to import anything,
// remember to import from 'vue-termui':
// import { ref } from 'vue-termui'

const n = ref(0)

const counter = ref(0)
onKeypress(['+', 'ArrowRight', 'ArrowUp'], () => {
  counter.value++
})
onKeypress(['-', 'ArrowLeft', 'ArrowDown'], () => {
  counter.value--
})

setInterval(() => {
  n.value++
}, 600)
</script>

<template>
  <Box
    :padding="2"
    :margin="2"
    width="100%"
    :maxWidth="50"
    justifyContent="center"
    alignItems="center"
    flexDirection="column"
    borderColor="yellowBright"
    borderStyle="round"
  >
    <Box :marginY="1">
      <Text color="cyanBright">Hello World </Text>
      <Text>{{ n % 2 ? '👋 ' : ' ✋' }}</Text>
    </Box>
    <Box>
      <Text
        >Counter:
        <Text :color="counter < 0 ? 'red' : 'green'" bold>{{ counter }}</Text>
        <Text dimmed>
          (<Text color="red" bold>-</Text>/<Text bold color="green">+</Text> to
          change it)</Text
        >
      </Text>
    </Box>
  </Box>
</template>
