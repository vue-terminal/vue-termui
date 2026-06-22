<script setup lang="ts">
import { Box, Newline, Text } from 'vue-termui'
</script>

<template>
  <Box flexDirection="column" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Text & styles</Text>
    <Newline />
    <Text bold>bold</Text>
    <Text italic>italic</Text>
    <Text underline>underline</Text>
    <Text dim>dim</Text>
    <Text strikethrough>strikethrough</Text>
    <Text inverse>inverse</Text>
    <Newline />
    <Text fg="#42b883">foreground color</Text>
    <Text fg="#0b0b0b" bg="#42b883">background color</Text>
    <Text fg="#ff8800" bold italic underline>bold + italic + underline</Text>
  </Box>
</template>
