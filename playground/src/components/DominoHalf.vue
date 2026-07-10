<script setup lang="ts">
import { computed } from 'vue'
import { Box, Text } from 'vue-termui'

type Pip = 0 | 1 | 2 | 3 | 4 | 5 | 6
type TileState = 'normal' | 'focused' | 'playable'

const props = withDefaults(
  defineProps<{
    value: Pip
    state?: TileState
  }>(),
  {
    state: 'normal',
  },
)

const FACE = '#e8dcc0'
const PIP = '#16140f'
const EDGE = '#8c7d60'
const FOCUSED = '#00d787'
const PLAYABLE = '#ffb84d'
const BOARD = '#07110b'

const pips: Record<Pip, string> = {
  0: '  ',
  1: '⠐ ',
  2: '⠁⢀',
  3: '⠑⢀',
  4: '⡁⢈',
  5: '⡑⢈',
  6: '⡃⢘',
}

const edge = computed(() => {
  if (props.state === 'focused') return FOCUSED
  if (props.state === 'playable') return PLAYABLE
  return EDGE
})
</script>

<template>
  <Box flexDirection="row" :gap="0">
    <Text :fg="edge" :bg="BOARD">▕</Text>
    <Text :fg="PIP" :bg="FACE">{{ pips[value] }}</Text>
    <Text :fg="edge" :bg="BOARD">▏</Text>
  </Box>
</template>
