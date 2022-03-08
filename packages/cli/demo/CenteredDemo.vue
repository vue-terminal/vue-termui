<script setup lang="ts">
import { TuiBox as Box, TuiText as Text, ref, onMounted } from 'vue-termui'

const n = ref(0)

onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1)
})
</script>

<template>
  <Box
    width="100%"
    :height="10"
    justifyContent="center"
    alignItems="center"
    borderStyle="round"
  >
    <Text>
      <Text color="cyanBright" bold>Hello World {{ n }}</Text>
      <Br />
      <Text>Full HMR support!</Text>
    </Text>
  </Box>
</template>
