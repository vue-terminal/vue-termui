<script setup lang="ts">
// Ported from @opentui/examples src/transparency-demo.ts
import {
  bold,
  Box,
  computed,
  fg,
  onKeyDown,
  reactive,
  ref,
  t,
  Text,
  underline,
  useTerminalSize,
} from 'vue-termui'

// The original queried the terminal palette to emulate a truly transparent
// renderer background; here the "transparent" theme simply uses a transparent
// page background (the app shell shows through).
const THEMES = {
  dark: {
    backgroundColor: '#0A0E14',
    headerAccent: '#00D4AA',
    headerMuted: '#A8A8B2',
    textUnderAlpha: '#FFB84D',
    moreTextUnder: '#7B68EE',
    boxLabelColor: '#FFFFFFDC',
    label: 'dark',
  },
  light: {
    backgroundColor: '#F6F1E5',
    headerAccent: '#0F766E',
    headerMuted: '#4B5563',
    textUnderAlpha: '#B45309',
    moreTextUnder: '#6D28D9',
    boxLabelColor: '#111827DC',
    label: 'light',
  },
  transparent: {
    backgroundColor: 'transparent',
    headerAccent: '#0284C7',
    headerMuted: '#64748B',
    textUnderAlpha: '#D97706',
    moreTextUnder: '#7C3AED',
    boxLabelColor: '#FFFFFFDC',
    label: 'transparent',
  },
} as const

type ThemeName = keyof typeof THEMES
const THEME_ORDER: ThemeName[] = ['dark', 'light', 'transparent']

const themeName = ref<ThemeName>('dark')
const theme = computed(() => THEMES[themeName.value])

const headerText = computed(
  () =>
    t`${bold(underline(fg(theme.value.headerAccent)('Interactive Alpha Transparency & Blending Demo - Drag the boxes!')))}
${fg(theme.value.headerMuted)(`Drag boxes with the mouse • Press B to cycle dark/light/transparent (current: ${theme.value.label})`)}`,
)

onKeyDown((key) => {
  if (key.name !== 'b') return
  const i = THEME_ORDER.indexOf(themeName.value)
  themeName.value = THEME_ORDER[(i + 1) % THEME_ORDER.length]!
})

// Alpha backgrounds as 8-digit hex (#RRGGBBAA); the label shows round(a * 100).
const boxes = reactive([
  { left: 15, top: 5, width: 25, height: 8, color: '#40B0FF80', alpha: '50%', zIndex: 50 },
  { left: 30, top: 7, width: 25, height: 8, color: '#FF6B81C0', alpha: '75%', zIndex: 30 },
  { left: 45, top: 9, width: 25, height: 8, color: '#8B45C140', alpha: '25%', zIndex: 10 },
  { left: 20, top: 11, width: 30, height: 5, color: '#58D68D60', alpha: '38%', zIndex: 20 },
  { left: 25, top: 13, width: 20, height: 6, color: '#FFB74D80', alpha: '50%', zIndex: 40 },
  { left: 10, top: 17, width: 65, height: 4, color: '#C8A2FF20', alpha: '13%', zIndex: 60 },
])
type AlphaBox = (typeof boxes)[number]

// Drag with per-element mouse events, moving by deltas between events (the
// original subclassed BoxRenderable and overrode onMouseEvent).
interface DragMouseEvent {
  x: number
  y: number
  stopPropagation(): void
}

const { width: cols, height: rows } = useTerminalSize()
let dragged: AlphaBox | null = null
let lastX = 0
let lastY = 0
let nextZIndex = 101

function startDrag(box: AlphaBox, event: DragMouseEvent): void {
  dragged = box
  lastX = event.x
  lastY = event.y
  box.zIndex = nextZIndex++
  event.stopPropagation()
}

function drag(box: AlphaBox, event: DragMouseEvent): void {
  if (dragged !== box) return
  box.left = Math.max(0, Math.min(box.left + event.x - lastX, cols.value - box.width))
  box.top = Math.max(0, Math.min(box.top + event.y - lastY, rows.value - box.height))
  lastX = event.x
  lastY = event.y
  event.stopPropagation()
}

function endDrag(box: AlphaBox, event: DragMouseEvent): void {
  if (dragged !== box) return
  dragged = null
  event.stopPropagation()
}
</script>

<template>
  <Box :flexGrow="1" :backgroundColor="theme.backgroundColor">
    <Text
      :content="headerText"
      position="absolute"
      :left="10"
      :top="2"
      :width="85"
      :height="3"
      :zIndex="1"
      :selectable="false"
    />
    <Text
      position="absolute"
      :left="10"
      :top="6"
      :fg="theme.textUnderAlpha"
      bold
      :zIndex="4"
      :selectable="false"
    >
      This text should not be selectable
    </Text>
    <Text position="absolute" :left="15" :top="10" :fg="theme.moreTextUnder" bold :zIndex="1">
      Selectable text to show character preservation
    </Text>

    <Box
      v-for="box of boxes"
      :key="box.color"
      position="absolute"
      :left="box.left"
      :top="box.top"
      :width="box.width"
      :height="box.height"
      :backgroundColor="box.color"
      :zIndex="box.zIndex"
      alignItems="center"
      justifyContent="center"
      @mouseDown="(e: DragMouseEvent) => startDrag(box, e)"
      @mouseDrag="(e: DragMouseEvent) => drag(box, e)"
      @mouseDragEnd="(e: DragMouseEvent) => endDrag(box, e)"
    >
      <Text :fg="theme.boxLabelColor" :selectable="false">{{ box.alpha }}</Text>
    </Box>
  </Box>
</template>
