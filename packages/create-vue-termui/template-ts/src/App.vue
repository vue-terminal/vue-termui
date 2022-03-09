<script lang="ts" setup>
import { ref } from 'vue-termui'

const n = ref(0)

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
    borderColor="yellowBright"
    borderStyle="round"
  >
    <Text color="cyanBright">Hello World </Text>
    <Text>{{ n % 2 ? '👋 ' : ' ✋' }}</Text>
  </Box>
</template>
