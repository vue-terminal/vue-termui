<script setup lang="ts">
import DominoChain from '../../components/DominoChain.vue'
import DominoHalf from '../../components/DominoHalf.vue'
import DominoRightJoin from '../../components/DominoRightJoin.vue'
import { Box, Text } from 'vue-termui'

type Pip = 0 | 1 | 2 | 3 | 4 | 5 | 6
type TileState = 'normal' | 'focused' | 'playable'

type HalfPlacement = {
  x: number
  value: Pip
  state?: TileState
}

type RightJoinPlacement = {
  x: number
  vertical: Pip
  a: Pip
  b: Pip
  state?: TileState
}

const BOARD = '#07110b'

const HALF_WIDTH = 4
const RIGHT_JOIN_WIDTH = 10
const TILE_STEP = 6

function verticalLeftOverTile(tileIndex: number) {
  return 2 + tileIndex * TILE_STEP
}

function spaces(count: number) {
  return ' '.repeat(Math.max(0, count))
}

function gapBeforeHalf(row: readonly HalfPlacement[], index: number) {
  const current = row[index]
  const previousEnd = index === 0 ? 0 : row[index - 1].x + HALF_WIDTH

  return current.x - previousEnd
}

function gapBeforeJoin(row: readonly RightJoinPlacement[], index: number) {
  const current = row[index]
  const previousEnd = index === 0 ? 0 : row[index - 1].x + RIGHT_JOIN_WIDTH

  return current.x - previousEnd
}

const mainLine = [
  { id: 'a', a: 1, b: 5 },
  { id: 'b', a: 5, b: 2 },
  { id: 'c', a: 2, b: 4 },
  { id: 'd', a: 4, b: 6 },
  { id: 'e', a: 6, b: 0, state: 'focused' },
  { id: 'f', a: 0, b: 3 },
] as const

/**
 * Top branch:
 *
 *     extra vertical domino
 *     ↓
 *     vertical domino touching main chain
 */
const topRows: HalfPlacement[][] = [
  [
    { x: verticalLeftOverTile(1), value: 2 },
    { x: verticalLeftOverTile(4), value: 1 },
  ],
  [
    { x: verticalLeftOverTile(1), value: 4 },
    { x: verticalLeftOverTile(4), value: 0 },
  ],
  [{ x: verticalLeftOverTile(1), value: 6, state: 'playable' }],
  [{ x: verticalLeftOverTile(1), value: 5, state: 'playable' }],
]

/**
 * First lower branch:
 * a simple vertical domino.
 */
const bottomHalfRows: HalfPlacement[][] = [
  [{ x: verticalLeftOverTile(2), value: 4 }],
  [{ x: verticalLeftOverTile(2), value: 4 }],
]

/**
 * Second lower branch:
 * vertical domino, then a horizontal domino continuing to the right.
 *
 *     main chain
 *        ↓
 *     vertical half
 *     vertical half │ horizontal domino
 */
const bottomJoinRows: RightJoinPlacement[][] = [
  [
    {
      x: verticalLeftOverTile(5),
      vertical: 3,
      a: 3,
      b: 1,
      state: 'focused',
    },
  ],
]
</script>

<template>
  <Box flexDirection="column" :gap="0" :paddingLeft="2" :bg="BOARD">
    <!-- vertical branches above the main chain -->
    <Box
      v-for="(row, rowIndex) in topRows"
      :key="`top-${rowIndex}`"
      flexDirection="row"
      :gap="0"
      :bg="BOARD"
    >
      <template v-for="(half, index) in row" :key="`top-${rowIndex}-${index}`">
        <Text :bg="BOARD">{{ spaces(gapBeforeHalf(row, index)) }}</Text>
        <DominoHalf :value="half.value" :state="half.state ?? 'normal'" />
      </template>
    </Box>

    <!-- main connected strip -->
    <DominoChain :tiles="mainLine" />

    <!-- simple vertical branch below the main chain -->
    <Box
      v-for="(row, rowIndex) in bottomHalfRows"
      :key="`bottom-half-${rowIndex}`"
      flexDirection="row"
      :gap="0"
      :bg="BOARD"
    >
      <template v-for="(half, index) in row" :key="`bottom-half-${rowIndex}-${index}`">
        <Text :bg="BOARD">{{ spaces(gapBeforeHalf(row, index)) }}</Text>
        <DominoHalf :value="half.value" :state="half.state ?? 'normal'" />
      </template>
    </Box>

    <!-- horizontal tile following a vertical tile -->
    <Box
      v-for="(row, rowIndex) in bottomJoinRows"
      :key="`bottom-join-${rowIndex}`"
      flexDirection="row"
      :gap="0"
      :bg="BOARD"
    >
      <template v-for="(join, index) in row" :key="`bottom-join-${rowIndex}-${index}`">
        <Text :bg="BOARD">{{ spaces(gapBeforeJoin(row, index)) }}</Text>
        <DominoRightJoin
          :vertical="join.vertical"
          :a="join.a"
          :b="join.b"
          :state="join.state ?? 'normal'"
        />
      </template>
    </Box>

    <Box
      flexDirection="row"
      :gap="1"
      alignItems="flex-end"
      :border="['top']"
      borderColor="#42b883"
      :paddingLeft="2"
    >
      <Text fg="#ffffff" bg="#000000">↹ cycle focus</Text>
      <Text dim>|</Text>
      <Text fg="#00d787">focused</Text>
      <Text dim>|</Text>
      <Text fg="#ffb84d">playable</Text>
      <Text dim>|</Text>
      <Text>⌃c exit</Text>
    </Box>
  </Box>
</template>
