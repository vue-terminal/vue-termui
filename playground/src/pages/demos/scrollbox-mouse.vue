<script setup lang="ts">
// Ported from opentui/packages/examples/src/scrollbox-mouse-test.ts
import { Box, bold, computed, fg, ref, ScrollBox, t, Text } from 'vue-termui'

const items = Array.from({ length: 50 }, (_, i) => ({
  id: `item-${i}`,
  content: t`${fg('#7aa2f7')(`[${String(i).padStart(2, '0')}]`)} ${fg('#c0caf5')(
    `Item ${i} - Hover over me to test hit detection`,
  )}`,
}))

const hovered = ref<string | null>(null)
// The original logged clicks to the console; surface them in the header instead.
const lastClicked = ref<string | null>(null)

const title = t`${bold(fg('#7aa2f7')('ScrollBox Mouse Hit Test'))} - Scroll and hover items to test hit detection`
const status = computed(
  () =>
    t`${fg('#565f89')('Hovered:')} ${fg('#9ece6a')(hovered.value ?? 'none')} ${fg('#565f89')('· Clicked:')} ${fg('#9ece6a')(lastClicked.value ?? 'none')}`,
)
</script>

<template>
  <Box flexDirection="column" width="100%">
    <Box
      width="100%"
      :height="3"
      backgroundColor="#24283b"
      :paddingLeft="1"
      :flexShrink="0"
      flexDirection="column"
    >
      <Text :content="title" />
      <Text :content="status" />
    </Box>
    <ScrollBox
      autofocus
      :height="14"
      :rootOptions="{ backgroundColor: '#24283b', border: true }"
      :contentOptions="{ backgroundColor: '#16161e' }"
    >
      <Box
        v-for="(item, i) in items"
        :key="item.id"
        width="100%"
        :height="2"
        :backgroundColor="i % 2 === 0 ? '#292e42' : '#2f3449'"
        :paddingLeft="1"
        @mouse-over="hovered = item.id"
        @mouse-out="hovered === item.id && (hovered = null)"
        @mouse-down="lastClicked = item.id"
      >
        <Text :content="item.content" />
      </Box>
    </ScrollBox>
  </Box>
</template>
