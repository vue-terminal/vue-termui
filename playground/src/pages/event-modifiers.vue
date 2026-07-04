<script setup lang="ts">
// Showcase for event-listener modifiers on components: `@keyDown.*` on a
// focusable box and `@mouseDown.*` on clickable boxes. Every handler below is
// filtered/managed declaratively by its modifiers — no `if (key.ctrl && …)`
// branching in the handler bodies.
import { Box, ref, Text } from 'vue-termui'

// Newest-first log of which modified handlers actually fired.
const events = ref<string[]>([])
const counter = ref(0)
const lastKey = ref('—')

function log(message: string): void {
  events.value.unshift(message)
  if (events.value.length > 8) events.value.pop()
}
</script>

<template>
  <Box flexDirection="column" :gap="1">
    <Box flexDirection="column" borderStyle="rounded" :padding="1">
      <Text bold fg="#42b883">Event modifiers</Text>
      <Text fg="#888888">
        `@keyDown` / `@mouse*` take Vue-style modifiers. Press Tab to focus the keyboard pad,
      </Text>
      <Text fg="#888888">then try the shortcuts. Click the mouse pad with different buttons.</Text>
    </Box>

    <Box flexDirection="row" :gap="1">
      <!-- Keyboard: element key events only fire while the box is focused. -->
      <Box
        flexDirection="column"
        :gap="1"
        :width="44"
        :padding="1"
        borderStyle="rounded"
        borderColor="#444444"
        focusedBorderColor="#42b883"
        focusable
        autofocus
        @keyDown="(e) => (lastKey = e.name)"
        @keyDown.enter="log('⏎  Enter')"
        @keyDown.ctrl.b="log('Ctrl+B — system chord')"
        @keyDown.ctrl.shift.k="log('Ctrl+Shift+K — combined chord')"
        @keyDown.up="counter++"
        @keyDown.down="counter--"
        @keyDown.x.exact="log('x — exact (no modifiers held)')"
        @keyDown.ctrl.x="log('Ctrl+X')"
        @keyDown.j.k="log('j or k — either key name')"
      >
        <Text bold>⌨ Keyboard (focus me)</Text>
        <Text fg="#888888">Enter · Ctrl+B · Ctrl+Shift+K</Text>
        <Text fg="#888888">↑/↓ counter · j or k · x vs Ctrl+X</Text>
        <Text fg="#42b883">Last key seen: {{ lastKey }}</Text>
        <Text fg="#42b883">Counter (↑/↓): {{ counter }}</Text>
      </Box>

      <!-- Mouse: element mouse events are routed by position, no focus needed. -->
      <Box
        flexDirection="column"
        :gap="1"
        :flexGrow="1"
        :padding="1"
        borderStyle="rounded"
        borderColor="#444444"
        @mouseDown.left.exact="log('🖱  left click — exact (no modifiers)')"
        @mouseDown.right="log('🖱  right click')"
        @mouseDown.middle="log('🖱  middle click')"
        @mouseDown.shift="log('⇧  shift + click')"
      >
        <Text bold>🖱 Mouse — click anywhere here</Text>
        <Text fg="#888888">left · right · middle · shift+click</Text>

        <!-- `.stop` keeps this click from bubbling to the outer handlers. -->
        <Box
          :padding="1"
          borderStyle="rounded"
          borderColor="#666666"
          @mouseDown.stop="log('🛑  inner click — .stop, outer skipped')"
        >
          <Text>Click me — .stop (won't reach the outer box)</Text>
        </Box>
      </Box>
    </Box>

    <Box flexDirection="column" borderStyle="rounded" :padding="1">
      <Text bold>Recent events</Text>
      <Text v-if="!events.length" fg="#666666"
        >(nothing yet — focus the pad or click the mouse)</Text
      >
      <Text v-for="(entry, i) in events" :key="i" :fg="i === 0 ? '#42b883' : '#aaaaaa'">
        {{ entry }}
      </Text>
    </Box>
  </Box>
</template>
