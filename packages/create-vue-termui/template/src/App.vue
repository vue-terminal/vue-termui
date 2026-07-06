<script setup lang="ts">
import { Box, Text, bold, t, onKeyDown, useExit } from 'vue-termui'

const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'q') exit()
})

// Style part of a line with a `StyledText` on the `content` prop. `<Text>` does
// not nest — build inline styling with `t` / `bold` / `fg` (re-exported from
// `vue-termui`).
const hello = t`Hello from vue-termui! Press ${bold('q')} to quit.`
</script>

<template>
  <Box border :padding="1">
    <Text :content="hello" />
  </Box>
</template>
