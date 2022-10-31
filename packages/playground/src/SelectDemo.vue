<script setup lang="ts">
import { ref } from 'vue-termui'
const value = ref('vue')
const options = [
  {
    value: 'vue',
    label: 'Vue',
  },
  {
    value: 'react',
    label: 'React',
  },
  {
    value: 'svelte',
    label: 'Svelte',
  },
  {
    value: 'solid',
    label: 'Solid',
  },
]

function submit(name: string, index: number) {
  console.log(name, index)
}
</script>

<template borderStyle="round">
  <Select v-model="value" @submit="submit">
    <Option :value="item.value" v-for="(item, index) in options" :key="index">
      <template v-slot="{ isActive }">
        <Box flexDirection="column">
          <Text :dimmed="isActive" :underline="isActive">{{ item.label }}</Text>
        </Box>
      </template>
    </Option>
  </Select>
</template>
