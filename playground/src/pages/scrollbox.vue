<script setup lang="ts">
import { Box, ref, ScrollBox, Text, useInterval } from 'vue-termui'

const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`)

// A live log to show sticky scroll: the view stays pinned to the bottom as
// entries arrive, until you scroll away (scroll back down to re-engage).
const logs = ref<string[]>(['app started'])
let n = 0
useInterval(() => {
  logs.value.push(`log entry ${++n}`)
  if (logs.value.length > 200) logs.value.shift()
}, 1000)
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">ScrollBox</Text>
    <!-- Autofocus so ↑/↓ scroll the list; Esc returns focus to the sidebar. -->
    <ScrollBox
      autofocus
      width="60%"
      :height="10"
      borderStyle="rounded"
      :scrollbarOptions="{ showArrows: true }"
    >
      <Box
        v-for="(item, i) in items"
        :key="item"
        width="100%"
        :paddingX="1"
        :backgroundColor="i % 2 === 0 ? '#292e42' : '#2f3449'"
      >
        <Text>{{ item }}</Text>
      </Box>
    </ScrollBox>
    <ScrollBox width="60%" :height="6" borderStyle="rounded" stickyScroll stickyStart="bottom">
      <Text v-for="(line, i) in logs" :key="i" fg="#9ece6a">{{ line }}</Text>
    </ScrollBox>
    <Text fg="#666666">↑/↓ scroll · PgUp/PgDn page · Home/End jump · ⇥ next box</Text>
  </Box>
</template>
