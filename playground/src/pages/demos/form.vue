<script setup lang="ts">
import { TextDecoder } from 'node:util'
import { Box, Input, onMounted, ProgressBar, ref, Text, useTemplateRef } from 'vue-termui'

const input = useTemplateRef('input')
onMounted(() => {
  console.log('the element is', input.value?.$el?.constructor?.name)
})

// The Input autofocuses, so typing flows here. Esc hands focus back to the
// sidebar (handled there); Ctrl+C quits (native, set in main.ts).
const name = ref('')
const max = 20
</script>

<template>
  <Box flexDirection="column" :padding="1" :gap="1" borderStyle="rounded">
    <Text fg="#42b883" bold>What is your name?</Text>
    <Input
      ref="input"
      v-model="name"
      placeholder="Type here…"
      autofocus
      :maxLength="max"
      :attributes="1"
      @paste="console.log('pasted', new TextDecoder().decode($event.bytes))"
    />
    <Box flexDirection="row" :gap="1">
      <ProgressBar :value="name.length" :max="max" :width="max" />
      <Text fg="#888888">{{ name.length }}/{{ max }}</Text>
    </Box>
    <Text v-if="name">Hello, {{ name }}! 👋</Text>
    <Input v-model="name" placeholder="I have autofocus too" autofocus />
    <Text fg="#888888">Esc to focus the sidebar · Ctrl+C to quit</Text>
  </Box>
</template>
