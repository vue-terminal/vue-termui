<script setup lang="ts">
import { KeyEvent } from '@opentui/core'
import { Box, ref, Text, Textarea } from 'vue-termui'

const notes = ref('')
const submitted = ref('')

function onSubmit(text: string): void {
  submitted.value = text
}

function handleTab(event: KeyEvent) {
  console.log('Geting key', event.name)
  if (event.name === 'tab') {
    event.stopPropagation()
  }
}
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Textarea (v-model)</Text>
    <!-- Autofocus so typing goes straight in; Esc returns focus to the sidebar.
         Enter inserts a newline, ⌘/Meta+Enter submits. -->
    <Textarea
      v-model="notes"
      autofocus
      placeholder="Type notes… (⌘+⏎ to submit)"
      wrapMode="word"
      width="50%"
      :height="6"
      backgroundColor="#1a1a1a"
      focusedBackgroundColor="#222222"
      cursorColor="#42b883"
      @keyDown="handleTab"
      @submit="onSubmit"
    />
    <Text fg="#666666">Lines: {{ notes.split('\n').length }} · Chars: {{ notes.length }}</Text>
    <Text v-if="submitted" fg="#42b883">Submitted {{ submitted.length }} chars 🎉</Text>
  </Box>
</template>
