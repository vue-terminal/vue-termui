<script setup lang="ts">
import { Box, Text, fg, t } from 'vue-termui'

// Isometric cube: green for the edges, pink for the faces.
const GREEN = '#42b883'
const PINK = '#ff6af0'

const line1 = t`${fg(PINK)(' _________')}`
const line2 = t`${fg(GREEN)('/')}${fg(PINK)('\\__\\__\\__\\')}`
const line3 = t`${fg(GREEN)('\\/__/')}${fg(PINK)('\\__\\')}${fg(GREEN)('_/')}`
const line4 = t`    ${fg(GREEN)('\\/__/')}`

const labelVue = t`[${fg(GREEN)('V')}]ue`
const labelTermUI = t`[${fg(GREEN)('T')}]ermUI`
</script>

<template>
  <Box
    flexDirection="column"
    borderStyle="double"
    borderColor="#42b883"
    :width="20"
    :height="8"
    :paddingX="1"
    justifyContent="center"
    alignItems="flex-start"
  >
    <Text :content="line1" />
    <Text :content="line2" />
    <Text :content="line3" />
    <Text :content="line4" />
    <Box alignSelf="flex-end" flexDirection="column" alignItems="flex-end" width="100%">
      <Text bold fg="#ffffff" :content="labelVue" />
      <Text bold fg="#ffffff" :content="labelTermUI" />
    </Box>
  </Box>
</template>
