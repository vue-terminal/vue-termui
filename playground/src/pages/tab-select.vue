<script setup lang="ts">
import { Box, ref, TabSelect, Text } from 'vue-termui'
import type { TabSelectOption } from 'vue-termui'

const options: TabSelectOption[] = [
  { name: 'Home', description: 'Dashboard and overview' },
  { name: 'Files', description: 'Browse and manage files' },
  { name: 'Editor', description: 'Edit the current document' },
  { name: 'Search', description: 'Find across the project' },
  { name: 'Settings', description: 'Application preferences' },
  { name: 'Profile', description: 'Your account and avatar' },
  { name: 'Help', description: 'Docs and keyboard shortcuts' },
]

const index = ref(0)
const chosen = ref('')
</script>

<template>
  <!-- Fixed-width bordered container. The TabSelect fills it with width="100%"
       so the tab strip tracks the box interior (border + padding aware) and the
       selected-tab highlight never bleeds past the border, however the terminal
       is resized. tabWidth keeps each tab compact; extra tabs scroll (‹ ›). -->
  <Box
    flexDirection="column"
    :gap="1"
    borderStyle="rounded"
    :padding="1"
    :width="60"
    :flexShrink="0"
  >
    <Text bold fg="#42b883">TabSelect (v-model)</Text>
    <!-- Autofocus so ←/→ drive the tabs; Esc returns focus to the sidebar. -->
    <TabSelect
      v-model="index"
      :options="options"
      autofocus
      width="100%"
      :tabWidth="16"
      wrapSelection
      textColor="#a0a0a0"
      selectedTextColor="#42b883"
      selectedBackgroundColor="#2c3e50"
      selectedDescriptionColor="#888888"
      focusedBackgroundColor="#1a1a1a"
      @select="(option) => (chosen = option?.name ?? '')"
    />
    <Text>Highlighted: {{ options[index]?.name }}</Text>
    <Text v-if="chosen" fg="#42b883">Selected: {{ chosen }} 🎉</Text>
    <Text fg="#666666">←/→ move · ⏎ select · wraps around</Text>
  </Box>
</template>
