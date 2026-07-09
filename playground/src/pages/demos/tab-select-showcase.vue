<script setup lang="ts">
// Ported from @opentui/examples src/tab-select-demo.ts (TabSelectRenderable feature showcase)
import {
  Box,
  bold,
  computed,
  fg,
  onKeyDown,
  ref,
  t,
  TabSelect,
  Text,
  useTemplateRef,
} from 'vue-termui'
import type { TabSelectOption } from 'vue-termui'

const tabOptions: TabSelectOption[] = [
  { name: 'Home', description: 'Welcome to the home page', value: 'home' },
  { name: 'Profile', description: 'Manage your user profile', value: 'profile' },
  { name: 'Settings', description: 'Configure application settings', value: 'settings' },
  { name: 'About', description: 'Learn more about this application', value: 'about' },
  { name: 'Help', description: 'Get help and support', value: 'help' },
  { name: 'Projects', description: 'View and manage your projects', value: 'projects' },
  { name: 'Dashboard', description: 'View analytics and statistics', value: 'dashboard' },
  { name: 'Reports', description: 'Generate and view reports', value: 'reports' },
  { name: 'Users', description: 'Manage user accounts', value: 'users' },
  { name: 'Admin', description: 'Administrative functions', value: 'admin' },
  { name: 'Tools', description: 'Various utility tools', value: 'tools' },
  { name: 'API', description: 'API documentation and testing', value: 'api' },
]

const index = ref(0)
const lastSelected = ref<TabSelectOption | null>(null)
const isFocused = ref(false)
const showUnderline = ref(true)
const showDescription = ref(true)
const showScrollArrows = ref(true)
const wrapSelection = ref(false)

const tabs = useTemplateRef('tabs')

// Tab/Esc are reserved by the playground shell; the demo's toggles are kept
onKeyDown((key) => {
  if (key.name === 'f') {
    const el = tabs.value?.$el
    if (el?.focused) el.blur()
    else el?.focus()
  } else if (key.name === 'u') {
    showUnderline.value = !showUnderline.value
  } else if (key.name === 'p') {
    showDescription.value = !showDescription.value
  } else if (key.name === 's') {
    showScrollArrows.value = !showScrollArrows.value
  } else if (key.name === 'w') {
    wrapSelection.value = !wrapSelection.value
  }
})

const keyLegend = t`${bold(fg('#FFFFFF')('Key Controls:'))}
←/→ or [/]: Navigate tabs
Enter: Select tab
F: Toggle focus
U: Toggle underline
P: Toggle description
S: Toggle scroll arrows
W: Toggle wrap selection
Esc: Focus the sidebar`

const status = computed(() => {
  const highlighted = tabOptions[index.value]
  const highlightedText = highlighted
    ? `Highlighted: ${highlighted.name} (${highlighted.value}) - Index: ${index.value}`
    : 'No highlighted item'
  const selectedText = lastSelected.value
    ? `Last Selected: ${lastSelected.value.name} (${lastSelected.value.value})`
    : 'No item selected yet (press Enter to select)'
  const focusText = isFocused.value ? 'Tab selector is FOCUSED' : 'Tab selector is BLURRED'
  const toggles = `Underline: ${showUnderline.value ? 'on' : 'off'} | Description: ${
    showDescription.value ? 'on' : 'off'
  } | Scroll arrows: ${showScrollArrows.value ? 'on' : 'off'} | Wrap: ${
    wrapSelection.value ? 'on' : 'off'
  }`

  return t`${fg('#00FF00')(highlightedText)}
${fg('#FFFF00')(selectedText)}

${fg(isFocused.value ? '#00FF00' : '#FF0000')(focusText)}

${fg('#CCCCCC')(toggles)}`
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">TabSelect showcase</Text>
    <TabSelect
      ref="tabs"
      v-model="index"
      :options="tabOptions"
      autofocus
      width="100%"
      :tabWidth="12"
      backgroundColor="#1e293b"
      focusedBackgroundColor="#2d3748"
      textColor="#e2e8f0"
      focusedTextColor="#f7fafc"
      selectedBackgroundColor="#3b82f6"
      selectedTextColor="#ffffff"
      selectedDescriptionColor="#cbd5e1"
      :showDescription="showDescription"
      :showUnderline="showUnderline"
      :showScrollArrows="showScrollArrows"
      :wrapSelection="wrapSelection"
      @selected="(option) => (lastSelected = option)"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <Text fg="#AAAAAA" :content="keyLegend" />
    <Text width="100%" :content="status" />
  </Box>
</template>
