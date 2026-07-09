<script setup lang="ts">
// Ported from opentui/packages/examples/src/sticky-scroll-example.ts
import {
  Box,
  bold,
  computed,
  fg,
  onKeyDown,
  ref,
  ScrollBox,
  t,
  Text,
  useInterval,
} from 'vue-termui'

const ANIMATION_MS = 800

interface DemoItem {
  id: number
  createdAt: number
  atTop: boolean
  time: string
}

const items = ref<DemoItem[]>([])
let nextId = 0

function addItem(atTop = false): void {
  nextId++
  const item: DemoItem = {
    id: nextId,
    createdAt: Date.now(),
    atTop,
    time: new Date().toLocaleTimeString(),
  }
  if (atTop) {
    items.value.unshift(item)
  } else {
    items.value.push(item)
  }
}

for (let i = 0; i < 10; i++) addItem(false)

const sticky = ref(true)

onKeyDown((key) => {
  if (key.name === 's') {
    sticky.value = !sticky.value
  } else if (key.name === 't') {
    addItem(true)
  } else if (key.name === 'b') {
    addItem(false)
  } else if (key.name === 'e') {
    items.value = []
    nextId = 0
  }
})

// Animation clock: ticks only while at least one item is still animating (the
// extra tick past ANIMATION_MS lets every item settle on its final colors).
const now = ref(Date.now())
useInterval(() => {
  if (items.value.some((item) => Date.now() - item.createdAt < ANIMATION_MS + 100)) {
    now.value = Date.now()
  }
}, 33)

function interpolateColor(color1: string, color2: string, factor: number): string {
  const c1 = parseInt(color1.slice(1), 16)
  const c2 = parseInt(color2.slice(1), 16)
  const r = Math.round(((c1 >> 16) & 0xff) + (((c2 >> 16) & 0xff) - ((c1 >> 16) & 0xff)) * factor)
  const g = Math.round(((c1 >> 8) & 0xff) + (((c2 >> 8) & 0xff) - ((c1 >> 8) & 0xff)) * factor)
  const b = Math.round((c1 & 0xff) + ((c2 & 0xff) - (c1 & 0xff)) * factor)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// Ease-out cubic progress of the item's spawn animation (bright → normal).
function progressFor(item: DemoItem): number {
  const p = Math.min((now.value - item.createdAt) / ANIMATION_MS, 1)
  return 1 - Math.pow(1 - p, 3)
}

function bgFor(item: DemoItem): string {
  const normalBg = item.id % 2 === 0 ? '#24283b' : '#1f2335'
  return interpolateColor('#4c4f69', normalBg, progressFor(item))
}

function contentFor(item: DemoItem) {
  const titleColor = interpolateColor('#bb9af7', '#7aa2f7', progressFor(item))
  return t`${bold(fg(titleColor)(`Item #${item.id}`))}
${fg('#9aa5ce')('This is a dynamically added item with enhanced content.')}
${fg('#c0caf5')('Contains additional information and styling.')}
${fg('#565f89')('Added at:')} ${item.time}
${fg('#565f89')('Position:')} ${item.atTop ? 'TOP' : 'BOTTOM'}
${fg('#565f89')('Status:')} ${fg('#9ece6a')('ACTIVE')}`
}

const instructions = t`${bold(fg('#7aa2f7')('Sticky Scroll Demo'))} ${fg('#565f89')('-')} ${bold(fg('#9ece6a')('S'))} ${fg('#c0caf5')('Toggle sticky scroll')} ${fg('#565f89')('|')} ${bold(fg('#bb9af7')('T'))} ${fg('#c0caf5')('Add item at top')} ${fg('#565f89')('|')} ${bold(fg('#f7768e')('B'))} ${fg('#c0caf5')('Add item at bottom')} ${fg('#565f89')('|')} ${bold(fg('#e0af68')('E'))} ${fg('#c0caf5')('Clear all items')}`
const behavior = t`${bold(fg('#7aa2f7')('Behavior:'))} ${fg('#c0caf5')('Scroll to top/bottom, then add items to see sticky behavior')}`
const statusLine = computed(
  () =>
    t`${bold(fg('#7aa2f7')('Status:'))} ${fg('#c0caf5')('Sticky Scroll:')} ${sticky.value ? fg('#9ece6a')('ENABLED') : fg('#f7768e')('DISABLED')}`,
)
</script>

<template>
  <Box flexDirection="column" width="100%" backgroundColor="#0f0f23">
    <ScrollBox
      autofocus
      :height="16"
      :stickyScroll="sticky"
      stickyStart="bottom"
      :rootOptions="{ backgroundColor: '#1e1e2e', border: true }"
      :wrapperOptions="{ backgroundColor: '#181825' }"
      :viewportOptions="{ backgroundColor: '#11111b' }"
      :contentOptions="{ backgroundColor: '#0f0f0f' }"
      :scrollbarOptions="{
        trackOptions: { foregroundColor: '#7aa2f7', backgroundColor: '#313244' },
      }"
    >
      <Box
        v-for="item in items"
        :key="item.id"
        width="auto"
        :padding="1"
        :marginBottom="1"
        :backgroundColor="bgFor(item)"
      >
        <Text :content="contentFor(item)" />
      </Box>
    </ScrollBox>
    <Box
      width="100%"
      flexDirection="column"
      backgroundColor="#1e1e2e"
      :paddingLeft="1"
      :flexShrink="0"
    >
      <Text :content="instructions" />
      <Text :content="behavior" />
      <Text :content="statusLine" />
    </Box>
  </Box>
</template>
