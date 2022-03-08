<script lang="ts" setup>
import { ref } from 'vue-termui'

const n = ref(0)

setInterval(() => {
  n.value++
}, 1000)
</script>

<template>
  <Box
    :padding="2"
    :margin="2"
    width="100%"
    :maxWidth="50"
    justifyContent="center"
    alignItems="center"
    borderStyle="round"
  >
    <Text bold color="green">Hello World {{ n % 2 ? ' 👋' : '👋 ' }}</Text>
  </Box>
</template>
