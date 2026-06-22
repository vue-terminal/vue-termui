<script setup lang="ts">
import { Box, Text } from 'vue-termui'
</script>

<template>
  <Box flexDirection="column" :gap="1">
    <Text bold fg="#42b883">Layout (flexbox)</Text>

    <Text>Row, gap 2, three sized boxes:</Text>
    <Box flexDirection="row" :gap="2" borderStyle="single" :padding="1">
      <Box backgroundColor="#42b883" :width="6" :height="3" />
      <Box backgroundColor="#35495e" :width="6" :height="3" />
      <Box backgroundColor="#ff8800" :width="6" :height="3" />
    </Box>

    <Text>Column, items centered in a 30-wide box:</Text>
    <Box
      flexDirection="column"
      alignItems="center"
      :gap="1"
      :width="30"
      borderStyle="single"
      :padding="1"
    >
      <Text>centered</Text>
      <Text fg="#888888">via alignItems="center"</Text>
    </Box>
  </Box>
</template>
