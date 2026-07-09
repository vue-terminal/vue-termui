<script setup lang="ts">
// Ported from opentui packages/examples/src/notification-demo.ts
import {
  bold,
  Box,
  computed,
  fg,
  onKeyDown,
  onScopeDispose,
  onUnmounted,
  ref,
  ScrollBox,
  t,
  Text,
  useRenderer,
} from 'vue-termui'

const P = {
  bg: '#08111f',
  panel: '#0f1b2d',
  panelAlt: '#111f34',
  border: '#223553',
  borderHot: '#22d3ee',
  text: '#d7e3f7',
  muted: '#7d8da8',
  cyan: '#22d3ee',
  violet: '#a78bfa',
  lime: '#bef264',
  rose: '#fb7185',
  amber: '#fbbf24',
  blue: '#60a5fa',
} as const

interface NotificationAction {
  key: string
  title: string
  subtitle: string
  accent: string
  message: string
  notificationTitle?: string
  delayed?: boolean
}

const actions: NotificationAction[] = [
  {
    key: '1',
    title: 'Quick ping',
    subtitle: 'Body-only notification',
    accent: P.cyan,
    message: 'OpenTUI notification ping delivered.',
  },
  {
    key: '2',
    title: 'Build complete',
    subtitle: 'Title and body',
    accent: P.lime,
    notificationTitle: 'OpenTUI build',
    message: 'The example build finished successfully.',
  },
  {
    key: '3',
    title: 'Async task',
    subtitle: 'Waits, then notifies',
    accent: P.violet,
    notificationTitle: 'Background task finished',
    message: 'The simulated background task is complete.',
    delayed: true,
  },
  {
    key: '4',
    title: 'Needs attention',
    subtitle: 'Prompt-style alert',
    accent: P.rose,
    notificationTitle: 'Action required',
    message: 'A task is waiting for your input in the terminal.',
  },
]

const renderer = useRenderer()

// Timers started from event handlers (delayed action, toast auto-dismiss) are
// outside the setup effect scope, so track and clear them by hand.
const timers = new Set<ReturnType<typeof setTimeout>>()
function after(ms: number, run: () => void) {
  const timer = setTimeout(() => {
    timers.delete(timer)
    run()
  }, ms)
  timers.add(timer)
}
onUnmounted(() => {
  for (const timer of timers) clearTimeout(timer)
  timers.clear()
})

// --- status (terminal capabilities) --------------------------------------
// `renderer.capabilities` is not reactive; bump a tick on the CAPABILITIES
// event so the computed status re-reads it.
const capsTick = ref(0)
const capabilityHandler = () => capsTick.value++
renderer.on('capabilities', capabilityHandler)
onScopeDispose(() => renderer.off('capabilities', capabilityHandler))

const statusContent = computed(() => {
  void capsTick.value
  const caps = renderer.capabilities
  const terminalName = caps?.terminal?.name || 'detecting'
  const terminalVersion = caps?.terminal?.version ? ` ${caps.terminal.version}` : ''
  const status = caps?.notifications === true ? fg(P.lime)('enabled') : fg(P.rose)('not detected')
  const transport =
    caps?.multiplexer === 'tmux'
      ? fg(P.amber)('tmux passthrough')
      : caps?.multiplexer === 'zellij'
        ? fg(P.amber)('Zellij OSC 99')
        : fg(P.blue)('direct OSC')

  return t`${bold(fg(P.text)('Terminal notifications'))}: ${status}
${fg(P.muted)('Terminal:')} ${fg(P.cyan)(`${terminalName}${terminalVersion}`)}  ${fg(P.muted)('Transport:')} ${transport}`
})

// --- activity log ---------------------------------------------------------
interface LogEntry {
  id: number
  text: string
  color: string
}

const MAX_LOG_ENTRIES = 80
let logId = 0
const logEntries = ref<LogEntry[]>([])

function addLog(message: string, color: string = P.muted) {
  const stamp = new Date().toLocaleTimeString()
  logEntries.value.push({ id: logId++, text: `${stamp}  ${message}`, color })
  while (logEntries.value.length > MAX_LOG_ENTRIES) logEntries.value.shift()
}

// --- in-app toasts (top-right corner, auto-dismissed) ---------------------
interface Toast {
  id: number
  title?: string | undefined
  message: string
  accent: string
}

let toastId = 0
const toasts = ref<Toast[]>([])

function showToast(action: NotificationAction) {
  const toast: Toast = {
    id: toastId++,
    title: action.notificationTitle,
    message: action.message,
    accent: action.accent,
  }
  toasts.value.push(toast)
  after(3500, () => {
    toasts.value = toasts.value.filter((other) => other.id !== toast.id)
  })
}

// --- actions ---------------------------------------------------------------
function sendNotification(action: NotificationAction) {
  const ok = renderer.triggerNotification(action.message, action.notificationTitle)
  addLog(
    ok ? `Sent: ${action.title}` : `Not sent: ${action.title} (unsupported)`,
    ok ? action.accent : P.rose,
  )
  showToast(action)
}

function triggerAction(action: NotificationAction) {
  if (action.delayed) {
    addLog('Started simulated background task...', action.accent)
    after(1400, () => sendNotification(action))
    return
  }
  sendNotification(action)
}

onKeyDown((key) => {
  const action = actions.find((candidate) => candidate.key === key.name)
  if (action) triggerAction(action)
})

// --- card hover/press state ------------------------------------------------
const hoveredKey = ref<string | null>(null)
const pressedKey = ref<string | null>(null)

function cardBackground(action: NotificationAction): string {
  if (pressedKey.value === action.key) return '#20365b'
  if (hoveredKey.value === action.key) return '#172845'
  return P.panelAlt
}

function cardBorder(action: NotificationAction): string {
  return hoveredKey.value === action.key ? action.accent : P.border
}

addLog('Demo ready. Press 1-4 or click a card.', P.cyan)
</script>

<template>
  <Box flexDirection="column" :padding="1" :backgroundColor="P.bg">
    <Box
      width="100%"
      flexDirection="column"
      :padding="1"
      :marginBottom="1"
      backgroundColor="#0d1b30"
      :border="true"
      borderStyle="rounded"
      :borderColor="P.borderHot"
      title=" OSC Notifications "
      titleAlignment="center"
    >
      <Text
        :content="
          t`${bold(fg(P.cyan)('System notifications'))} ${fg(P.muted)('from terminal OSC sequences')}`
        "
      />
      <Text :fg="P.text" :content="statusContent" />
    </Box>

    <Box width="100%" flexDirection="row" :gap="1" :marginBottom="1" :backgroundColor="P.bg">
      <Box
        v-for="action in actions"
        :key="action.key"
        :height="9"
        :minWidth="18"
        :flexGrow="1"
        :flexShrink="1"
        flexDirection="column"
        :padding="1"
        :backgroundColor="cardBackground(action)"
        :border="true"
        borderStyle="rounded"
        :borderColor="cardBorder(action)"
        :title="` ${action.key} `"
        titleAlignment="left"
        @mouseOver="hoveredKey = action.key"
        @mouseOut="((hoveredKey = null), (pressedKey = null))"
        @mouseDown.stop="((pressedKey = action.key), triggerAction(action))"
        @mouseUp.stop="pressedKey = null"
      >
        <Text :content="t`${bold(fg(action.accent)(action.title))}`" />
        <Text :fg="P.muted">{{ action.subtitle }}</Text>
        <Box :flexGrow="1" />
        <Text
          :content="
            t`${fg(action.accent)('Click')} ${fg(P.muted)('or press')} ${bold(fg(P.text)(action.key))}`
          "
        />
      </Box>
    </Box>

    <Box width="100%" :height="14" flexDirection="row" :gap="1" :backgroundColor="P.bg">
      <Box
        :width="38"
        height="100%"
        flexDirection="column"
        :padding="1"
        :backgroundColor="P.panel"
        :border="true"
        borderStyle="rounded"
        :borderColor="P.border"
        title=" Controls "
      >
        <Text
          :content="
            t`${fg(P.cyan)('1')} Quick ping
${fg(P.lime)('2')} Build complete
${fg(P.violet)('3')} Async task
${fg(P.rose)('4')} Needs attention
${fg(P.muted)('Mouse')} Click any card`
          "
        />
      </Box>
      <Box
        height="100%"
        :flexGrow="1"
        flexDirection="column"
        :padding="1"
        :backgroundColor="P.panel"
        :border="true"
        borderStyle="rounded"
        :borderColor="P.border"
        title=" Activity "
      >
        <ScrollBox width="100%" height="100%" stickyScroll stickyStart="bottom">
          <Text v-for="entry in logEntries" :key="entry.id" :fg="entry.color">{{
            entry.text
          }}</Text>
        </ScrollBox>
      </Box>
    </Box>

    <!-- In-app toasts: reactive stand-in for the OS notification bubble. -->
    <Box
      position="absolute"
      :top="0"
      :right="1"
      :zIndex="100"
      flexDirection="column"
      :gap="1"
      :width="42"
    >
      <Box
        v-for="toast in toasts"
        :key="toast.id"
        flexDirection="column"
        :padding="1"
        backgroundColor="#0d1b30"
        :border="true"
        borderStyle="rounded"
        :borderColor="toast.accent"
        title=" 🔔 "
        titleAlignment="left"
      >
        <Text v-if="toast.title" :content="t`${bold(fg(toast.accent)(toast.title))}`" />
        <Text :fg="P.text">{{ toast.message }}</Text>
      </Box>
    </Box>
  </Box>
</template>
