<script setup lang="ts">
import { Box, Text, bold, t, onKeyDown, ref, useExit, useTemplateRef } from 'vue-termui'
import VueTermUILogo from './components/VueTermUILogo.vue'

const exit = useExit()
const count = ref(0)
const logo = useTemplateRef('logo')

onKeyDown((key) => {
  if (key.name === 'q') exit()
  else if (key.name === 'up' || key.name === 'right') count.value++
  else if (key.name === 'down' || key.name === 'left') count.value--
  else if (key.name === 'r') logo.value?.replay()
})

// Style part of a line with a `StyledText` on the `content` prop. `<Text>` does
// not nest — build inline styling with `t` / `bold` / `fg` (re-exported from
// `vue-termui`).
const hint = t`${bold('↑')}/${bold('↓')} counter · ${bold('r')} replay logo · ${bold('q')} quit`
</script>

<template>
  <Box flexDirection="column" :padding="1" :gap="1">
    <VueTermUILogo ref="logo" />
    <Box :border="true" :paddingX="1" :width="20" justifyContent="center">
      <Text :content="`Counter: ${count}`" />
    </Box>
    <Text :content="hint" />
  </Box>
</template>
