<script setup lang="ts">
// Ported (trimmed) from opentui/packages/examples/src/keypress-debug-demo.ts
// Kept: live key name/sequence/modifiers/raw bytes, keydown vs keyup, a sticky
// event feed and a session/latest-event detail pane, JSON toggle (Shift+J) and
// session clear (Shift+L). Dropped: save-to-file, paste capture and the raw
// input tap (need non-exported internals / node:fs), the help modal, and kitty
// protocol toggling (a renderer construction option, not togglable here).
import {
  Box,
  computed,
  type KeyEvent,
  onKeyDown,
  onKeyUp,
  ref,
  ScrollBox,
  Text,
  useRenderer,
} from 'vue-termui'

const MAX_VISIBLE_EVENTS = 120

interface KeySnapshot {
  id: number
  timestamp: number
  type: 'down' | 'up'
  name: string
  ctrl: boolean
  meta: boolean
  shift: boolean
  option: boolean
  sequence: string
  raw: string
  eventType: string
  source: string
}

const renderer = useRenderer()
const events = ref<KeySnapshot[]>([])
const showJson = ref(false)
let totalCount = 0
const total = ref(0)

function record(event: KeyEvent, type: 'down' | 'up'): void {
  total.value = ++totalCount
  events.value.push({
    id: totalCount,
    timestamp: Date.now(),
    type,
    name: event.name,
    ctrl: event.ctrl,
    meta: event.meta,
    shift: event.shift,
    option: event.option,
    sequence: event.sequence,
    raw: event.raw,
    eventType: event.eventType,
    source: event.source,
  })
  if (events.value.length > MAX_VISIBLE_EVENTS) events.value.shift()
}

onKeyDown((key) => {
  if (key.shift && key.name === 'j') {
    showJson.value = !showJson.value
    return
  }
  if (key.shift && key.name === 'l') {
    events.value = []
    totalCount = 0
    total.value = 0
    return
  }
  record(key, 'down')
})

onKeyUp((key) => record(key, 'up'))

function formatClock(timestamp: number): string {
  const date = new Date(timestamp)
  return (
    `${String(date.getHours()).padStart(2, '0')}:` +
    `${String(date.getMinutes()).padStart(2, '0')}:` +
    `${String(date.getSeconds()).padStart(2, '0')}.` +
    `${String(date.getMilliseconds()).padStart(3, '0')}`
  )
}

function formatModifiers(snapshot: KeySnapshot): string {
  const modifiers = [
    snapshot.ctrl && 'Ctrl',
    snapshot.meta && 'Meta',
    snapshot.shift && 'Shift',
    snapshot.option && 'Option',
  ].filter(Boolean)
  return modifiers.length > 0 ? modifiers.join('+') : '-'
}

function formatCombo(snapshot: KeySnapshot): string {
  const modifiers = formatModifiers(snapshot)
  const name = snapshot.name === ' ' ? 'Space' : snapshot.name || '-'
  return modifiers === '-' ? name : `${modifiers}+${name}`
}

function formatBytes(raw: string): string {
  return (
    [...raw]
      .map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`)
      .join(' ') || '-'
  )
}

function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3)}...`
}

function formatRow(snapshot: KeySnapshot): string {
  const id = String(snapshot.id).padStart(3, '0')
  const combo = truncate(formatCombo(snapshot), 18).padEnd(18)
  const seq = truncate(JSON.stringify(snapshot.sequence), 20)
  return `${id} ${formatClock(snapshot.timestamp)} ${snapshot.type.padEnd(4)} ${combo} src=${snapshot.source} seq=${seq}`
}

const latest = computed(() => events.value[events.value.length - 1])

const statusLine = computed(() =>
  [
    'Keypress Debug',
    `events ${total.value}`,
    `visible ${events.value.length}`,
    `kitty ${renderer.capabilities?.kitty_keyboard ? 'on' : 'off'}`,
    `json ${showJson.value ? 'on' : 'off'}`,
    `latest ${latest.value ? formatCombo(latest.value) : 'none'}`,
  ].join(' | '),
)

const detail = computed(() => {
  const lines = [
    'Session',
    `terminal      ${renderer.capabilities?.terminal?.name ?? 'unknown'}`,
    `kitty kb      ${renderer.capabilities?.kitty_keyboard ? 'on' : 'off'}`,
    `parsed events ${total.value}`,
  ]
  const snapshot = latest.value
  if (!snapshot) {
    lines.push('', 'Latest Event', 'no parsed event yet')
    return lines.join('\n')
  }
  lines.push(
    '',
    'Latest Event',
    `index         #${snapshot.id}`,
    `combo         ${formatCombo(snapshot)}`,
    `name          ${JSON.stringify(snapshot.name)}`,
    `sequence      ${JSON.stringify(snapshot.sequence)}`,
    `raw           ${JSON.stringify(snapshot.raw)}`,
    `raw bytes     ${formatBytes(snapshot.raw)}`,
    `source        ${snapshot.source}`,
    `event type    ${snapshot.eventType}`,
    `modifiers     ${formatModifiers(snapshot)}`,
  )
  if (showJson.value) {
    lines.push('', 'JSON', JSON.stringify(snapshot, null, 2))
  }
  return lines.join('\n')
})
</script>

<template>
  <Box flexDirection="column" width="100%">
    <Text fg="#E6EDF3" :flexShrink="0">{{ statusLine }}</Text>
    <Box width="100%" :height="18" flexDirection="row">
      <ScrollBox
        :flexGrow="1"
        :flexShrink="1"
        :border="true"
        borderColor="#58A6FF"
        title="Event Feed"
        titleAlignment="left"
        stickyScroll
        stickyStart="bottom"
        backgroundColor="#0F1722"
        :contentOptions="{ padding: 1 }"
        :verticalScrollbarOptions="{ visible: false }"
      >
        <Text fg="#8B949E" wrapMode="none">ID TIME TYPE KEY NOTES</Text>
        <Text v-if="!events.length" fg="#C9D1D9">-- waiting for key events --</Text>
        <Text
          v-for="snapshot in events"
          :key="snapshot.id"
          :fg="snapshot === latest ? '#9ece6a' : '#C9D1D9'"
          wrapMode="none"
        >
          {{ formatRow(snapshot) }}
        </Text>
      </ScrollBox>
      <ScrollBox
        width="42%"
        :flexShrink="0"
        :marginLeft="1"
        :border="true"
        borderColor="#A371F7"
        title="Session / Latest Event"
        titleAlignment="left"
        backgroundColor="#111827"
        :contentOptions="{ padding: 1 }"
        :verticalScrollbarOptions="{ visible: false }"
      >
        <Text fg="#E6EDF3">{{ detail }}</Text>
      </ScrollBox>
    </Box>
    <Text fg="#8B949E" :flexShrink="0"
      >Controls: Shift+J:json Shift+L:clear · releases need kitty keyboard support</Text
    >
  </Box>
</template>
