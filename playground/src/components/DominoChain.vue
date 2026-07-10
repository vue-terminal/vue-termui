<!-- components/DominoChain.vue -->
<script setup lang="ts">
import { Box, Text } from 'vue-termui'

type Pip = 0 | 1 | 2 | 3 | 4 | 5 | 6
type TileState = 'normal' | 'focused' | 'playable'

defineProps<{
  tiles: readonly {
    id: string
    a: Pip
    b: Pip
    state?: TileState
  }[]
}>()

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

function edgeColor(state?: TileState) {
  if (state === 'focused') return FOCUSED
  if (state === 'playable') return PLAYABLE
  return EDGE
}
</script>

<template>
  <Box flexDirection="row" :gap="0">
    <!-- only the outside edges use board bg -->
    <Text :fg="EDGE" :bg="BOARD">▕</Text>

    <template v-for="(d, i) in tiles" :key="d.id">
      <!-- left half -->
      <Text :fg="PIP" :bg="FACE">{{ pips[d.a] }}</Text>

      <!-- separator inside a domino: keep the softer dotted line -->
      <Text :fg="edgeColor(d.state)" :bg="FACE">┆</Text>

      <!-- right half -->
      <Text :fg="PIP" :bg="FACE">{{ pips[d.b] }}</Text>

      <!-- separator between dominos: solid thin line -->
      <Text v-if="i < tiles.length - 1" :fg="EDGE" :bg="FACE">│</Text>
    </template>

    <Text :fg="EDGE" :bg="BOARD">▏</Text>
  </Box>
</template>
