<script setup lang="ts">
import { Box, Text, onKeyDown, useExit } from 'vue-termui'

const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'q') exit()
})
</script>

<template>
  <Box border :padding="1">
    <Text>Hello from vue-termui! Press <Text bold>q</Text> to quit.</Text>
  </Box>
</template>
