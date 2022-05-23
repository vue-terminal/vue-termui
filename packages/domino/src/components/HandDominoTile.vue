<script lang="ts" setup>
import { DominoTile, DominoTileDirection } from '../engine'
import { useFocus, Ref } from 'vue-termui'

const props = defineProps<{
  tile: DominoTile
  hidden?: boolean
  disabled?: boolean
}>()

const { active } = useFocus({
  disabled: toRef(props, 'disabled') as Ref<boolean>,
})
</script>

<template>
  <Text>
    <Text :inverse="active">{{ tile }}</Text>
    <Text>&nbsp;</Text>
  </Text>
</template>

<!-- <Box borderStyle="round" flexDirection="column">
    <Text> ⠿ </Text>
    <Text>-⋅-</Text>
    <Text> ⠿ </Text>
  </Box> -->
