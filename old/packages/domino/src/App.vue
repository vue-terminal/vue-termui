<script lang="ts" setup>
import Game from './views/Game.vue'
import { useDebugLog, onKeyData } from 'vue-termui'

const root = useRootNode()
const write = useDebugLog('logs.log')

onKeyData('D', (event) => {
  if (event.ctrlKey) {
    write(root)
    write('-'.repeat(80))
  }
})
</script>

<template>
  <Box
    width="100%"
    justifyContent="center"
    alignItems="center"
    flexDirection="column"
  >
    <Game />
  </Box>
</template>
