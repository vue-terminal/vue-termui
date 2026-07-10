<script setup lang="ts">
import { Box, Text } from 'vue-termui'

type Pip = 0 | 1 | 2 | 3 | 4 | 5 | 6

const props = defineProps<{
  tiles: readonly {
    id: string
    a: Pip
    b: Pip
    state?: 'normal' | 'focused' | 'playable'
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

function edgeColor(state?: string) {
  if (state === 'focused') return FOCUSED
  if (state === 'playable') return PLAYABLE
  return EDGE
}
</script>

<template>
  <Box flexDirection="row" :gap="0">
    <!-- start cap -->
    <Text :fg="EDGE" :bg="BOARD">▕</Text>

    <template v-for="(d, i) in props.tiles" :key="d.id">
      <Text :fg="PIP" :bg="FACE">{{ pips[d.a] }}</Text>
      <Text :fg="edgeColor(d.state)" :bg="FACE">┆</Text>
      <Text :fg="PIP" :bg="FACE">{{ pips[d.b] }}</Text>

      <!-- shared connector, not two side rails -->
      <Text v-if="i < props.tiles.length - 1" :fg="edgeColor(d.state)" :bg="FACE">╎</Text>
    </template>

    <!-- end cap -->
    <Text :fg="EDGE" :bg="BOARD">▏</Text>
  </Box>
</template>
