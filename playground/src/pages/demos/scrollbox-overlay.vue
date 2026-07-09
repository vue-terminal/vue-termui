<script setup lang="ts">
// Ported from opentui/packages/examples/src/scrollbox-overlay-hit-test.ts
// Esc is reserved by the app shell, so the dialog closes with `d` (toggle) or
// by clicking the red overlay; the original's `q` (quit) is dropped.
import { Box, bold, computed, fg, onKeyDown, ref, ScrollBox, t, Text } from 'vue-termui'

const dialogOpen = ref(false)
const lastClick = ref('none')

const lines = Array.from(
  { length: 50 },
  (_, i) => t`${fg('#cbd5f5')(`Line ${i + 1}: This is some content`)}`,
)

const status = computed(() => t`${fg('#9aa5ce')('Last click:')} ${fg('#9ece6a')(lastClick.value)}`)

onKeyDown((key) => {
  if (key.name === 'd') dialogOpen.value = !dialogOpen.value
})
</script>

<template>
  <Box
    flexDirection="column"
    width="100%"
    :height="22"
    backgroundColor="#1a1b26"
    :gap="1"
    :paddingLeft="1"
    :paddingTop="1"
  >
    <Text :content="t`${bold(fg('#7aa2f7')('Scrollbox Overlay Hit Test'))}`" />
    <Text fg="#c0caf5">Press 'd' to toggle the dialog, click the red overlay to close it</Text>
    <Text :content="status" />

    <!-- Full-size overlay: clicking it closes the dialog. Kept mounted and
         toggled via `visible` so the scrollbox preserves its scroll position. -->
    <Box
      position="absolute"
      :top="0"
      :left="0"
      width="100%"
      height="100%"
      backgroundColor="#ff000033"
      :zIndex="100"
      :visible="dialogOpen"
      @mouse-down="((lastClick = 'overlay (red)'), (dialogOpen = false))"
    >
      <Box
        position="absolute"
        top="25%"
        left="25%"
        width="50%"
        height="50%"
        flexDirection="column"
        :gap="1"
        :padding="1"
        backgroundColor="#0f172a"
        :border="true"
        borderColor="#7aa2f7"
        @mouse-down.stop="lastClick = 'dialog (blue)'"
      >
        <Text
          :content="
            t`${bold(fg('#7aa2f7')('Dialog'))} ${fg('#565f89')('- scroll, then click outside the list')}`
          "
        />
        <Text fg="#c0caf5">Click the red overlay above/below the dialog to close it</Text>
        <Text :content="status" />
        <ScrollBox
          :flexGrow="1"
          :rootOptions="{ backgroundColor: '#eab308', border: true, borderColor: '#0f172a' }"
          :contentOptions="{ backgroundColor: '#111827' }"
          @mouse-down.stop="lastClick = 'scrollbox (yellow)'"
        >
          <Box
            v-for="(line, i) in lines"
            :key="i"
            width="100%"
            :height="1"
            :paddingLeft="1"
            :backgroundColor="i % 2 === 0 ? '#1f2937' : '#111827'"
          >
            <Text :content="line" />
          </Box>
        </ScrollBox>
      </Box>
    </Box>
  </Box>
</template>
