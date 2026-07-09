<script setup lang="ts">
// Ported from opentui packages/examples/src/focus-restore-demo.ts
import { Box, computed, onScopeDispose, ref, ScrollBox, Text, useRenderer } from 'vue-termui'

const renderer = useRenderer()

const mouseX = ref(0)
const mouseY = ref(0)
const mouseEvents = ref(0)
const focusCount = ref(0)
const blurCount = ref(0)
const lastFocusTime = ref('')
const lastBlurTime = ref('')
const lastMouseTime = ref('')
const focused = ref(true)

interface LogEntry {
  id: number
  text: string
  color: string
}

const MAX_LOG_ENTRIES = 20
let logId = 0
const logEntries = ref<LogEntry[]>([])

function ts(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function addLogLine(text: string, color: string) {
  logEntries.value.push({ id: logId++, text, color })
  while (logEntries.value.length > MAX_LOG_ENTRIES) logEntries.value.shift()
}

// Terminal focus/blur (alt-tab away and back) arrive as renderer events.
const focusHandler = () => {
  focused.value = true
  focusCount.value++
  lastFocusTime.value = ts()
  addLogLine(`[${ts()}] FOCUS IN  - terminal modes restored`, '#7ee787')
}
const blurHandler = () => {
  focused.value = false
  blurCount.value++
  lastBlurTime.value = ts()
  addLogLine(`[${ts()}] FOCUS OUT - terminal may strip escape codes`, '#ffa500')
}
renderer.on('focus', focusHandler)
renderer.on('blur', blurHandler)
onScopeDispose(() => {
  renderer.off('focus', focusHandler)
  renderer.off('blur', blurHandler)
})

// All mouse events over the page bubble up to the root Box's `onMouse`.
function onMouse(event: { x: number; y: number }) {
  mouseX.value = event.x
  mouseY.value = event.y
  mouseEvents.value++
  lastMouseTime.value = ts()
}

const focusStatusText = computed(() =>
  focused.value
    ? 'Focus: YES  (terminal modes active)'
    : 'Focus: NO   (modes may be stripped by terminal)',
)
const focusStatusColor = computed(() => (focused.value ? '#7ee787' : '#ff6464'))

addLogLine(`[${ts()}] Demo started. Move mouse, then alt-tab away and back.`, '#a5d6ff')
</script>

<template>
  <Box flexDirection="column" :padding="1" @mouse="onMouse">
    <Text bold fg="#48d1cc">Focus Restore Demo - Mouse Tracking + Terminal Mode Restore</Text>
    <Text fg="#a0a0b4"
      >Move mouse to see tracking. Alt-tab away and back. Mouse should resume.</Text
    >
    <Text fg="#a0a0b4">Minimize and restore. Try clicking after returning.</Text>

    <Box
      :border="true"
      borderColor="#4ECDC4"
      borderStyle="rounded"
      title="Terminal State"
      titleAlignment="center"
      :padding="1"
      flexDirection="column"
      :marginTop="1"
    >
      <Text :fg="focusStatusColor">{{ focusStatusText }}</Text>
      <Text fg="#a5d6ff">Mouse: ({{ mouseX }}, {{ mouseY }}) | Events: {{ mouseEvents }}</Text>
      <Text fg="#d2a8ff">Focus-in: {{ focusCount }} | Focus-out: {{ blurCount }}</Text>
      <Text fg="#8b949e"
        >Last focus: {{ lastFocusTime || '--' }} | Last blur: {{ lastBlurTime || '--' }} | Last
        mouse: {{ lastMouseTime || '--' }}</Text
      >
    </Box>

    <Box
      :border="true"
      borderColor="#6BCF7F"
      borderStyle="rounded"
      title="Event Log (latest 20)"
      titleAlignment="center"
      :marginTop="1"
    >
      <ScrollBox width="100%" :height="10" :padding="1" stickyScroll stickyStart="bottom">
        <Text v-for="entry in logEntries" :key="entry.id" :fg="entry.color">{{ entry.text }}</Text>
      </ScrollBox>
    </Box>
  </Box>
</template>
