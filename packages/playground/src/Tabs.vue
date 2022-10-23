<script setup lang="ts">
import {
  TuiBox as Box,
  TuiText as Text,
  TuiTabs as Tabs,
  TuiTab as Tab,
  ref,
  computed,
} from 'vue-termui'

const tabIndex = ref(2)
const tabs = ['Vue', 'Vite', 'Pinia', 'VueUse', 'VueTermui']
const selected = computed(() => tabs[tabIndex.value])
function onChange(index: number) {}
</script>

<template>
  <Box
    width="30"
    justifyContent="center"
    alignItems="center"
    borderStyle="double"
  >
    <Text>
      Selected:
      <Text color="yellow">{{ selected }}</Text>
    </Text>
  </Box>
  <Box
    width="30"
    justifyContent="center"
    alignItems="center"
    borderStyle="round"
  >
    <Tabs v-model="tabIndex" @on-change="onChange">
      <Tab v-for="(tab, index) in tabs" :key="index">{{ tab }}</Tab>
    </Tabs>
  </Box>
</template>
