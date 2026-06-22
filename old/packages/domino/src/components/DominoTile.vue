<script lang="ts" setup>
import { DominoTile, DominoTileDirection } from '../engine'

const props = defineProps<{ tile: DominoTile; hidden?: boolean }>()
const hiddenTile = computed(() =>
  props.tile.direction === DominoTileDirection.horizontal ? '🀰' : '🁢'
)
</script>

<template>
  <Text>{{ hidden ? hiddenTile : tile }}</Text>
</template>

<!-- <Box borderStyle="round" flexDirection="column">
    <Text> ⠿ </Text>
    <Text>-⋅-</Text>
    <Text> ⠿ </Text>
  </Box> -->
