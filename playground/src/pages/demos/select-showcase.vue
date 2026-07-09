<script setup lang="ts">
// Ported from @opentui/examples src/select-demo.ts (SelectRenderable feature showcase)
import {
  Box,
  bold,
  computed,
  fg,
  onKeyDown,
  ref,
  Select,
  t,
  Text,
  useTemplateRef,
  watch,
} from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const selectOptions: SelectOption[] = [
  { name: 'Home', description: 'Navigate to the home page', value: 'home' },
  { name: 'Profile', description: 'View and edit your user profile', value: 'profile' },
  { name: 'Settings', description: 'Configure application preferences', value: 'settings' },
  { name: 'Dashboard', description: 'View analytics and key metrics', value: 'dashboard' },
  { name: 'Projects', description: 'Manage your active projects', value: 'projects' },
  { name: 'Reports', description: 'Generate and view detailed reports', value: 'reports' },
  { name: 'Users', description: 'Manage user accounts and permissions', value: 'users' },
  { name: 'Analytics', description: 'Deep dive into usage analytics', value: 'analytics' },
  { name: 'Tools', description: 'Access various utility tools', value: 'tools' },
  { name: 'API Documentation', description: 'Browse API endpoints and examples', value: 'api' },
  { name: 'Help Center', description: 'Find answers to common questions', value: 'help' },
  { name: 'Support', description: 'Contact our support team', value: 'support' },
  { name: 'Billing', description: 'Manage your subscription and billing', value: 'billing' },
  { name: 'Integrations', description: 'Connect with third-party services', value: 'integrations' },
  { name: 'Security', description: 'Configure security settings', value: 'security' },
  { name: 'Notifications', description: 'Manage notification preferences', value: 'notifications' },
  { name: 'Backup', description: 'Backup and restore your data', value: 'backup' },
  { name: 'Import/Export', description: 'Import or export your data', value: 'import-export' },
  { name: 'Advanced Settings', description: 'Configure advanced options', value: 'advanced' },
  { name: 'About', description: 'Learn more about this application', value: 'about' },
]

const index = ref(0)
const isFocused = ref(false)
const showDescription = ref(true)
const showScrollIndicator = ref(true)
const wrapSelection = ref(false)

const select = useTemplateRef('select')

const lastAction = ref('Welcome to the Select demo! Use the controls to test features.')
const lastActionColor = ref('#FFCC00')
let resetTimer: ReturnType<typeof setTimeout> | undefined
function flash(text: string, color: string, resetAfter?: number) {
  clearTimeout(resetTimer)
  lastAction.value = text
  lastActionColor.value = color
  if (resetAfter) {
    resetTimer = setTimeout(() => {
      lastActionColor.value = '#FFCC00'
    }, resetAfter)
  }
}

watch(index, (i) => {
  const option = selectOptions[i]
  if (option) flash(`Navigation: Moved to "${option.name}"`, '#FFCC00')
})

function onSelect(option: SelectOption | null) {
  if (option) flash(`*** ACTIVATED: ${option.name} (${option.value}) ***`, '#FF00FF', 1000)
}

// Tab/Esc are reserved by the playground shell; the demo's toggles are kept
onKeyDown((key) => {
  const el = select.value?.$el
  if (key.name === 'f') {
    if (el?.focused) {
      el.blur()
      flash('Focus removed from select element', '#FFCC00')
    } else {
      el?.focus()
      flash('Select element focused', '#FFCC00')
    }
  } else if (key.name === 'd') {
    showDescription.value = !showDescription.value
    flash(`Descriptions ${showDescription.value ? 'enabled' : 'disabled'}`, '#FFCC00')
  } else if (key.name === 's') {
    showScrollIndicator.value = !showScrollIndicator.value
    flash(`Scroll indicator ${showScrollIndicator.value ? 'enabled' : 'disabled'}`, '#FFCC00')
  } else if (key.name === 'w') {
    wrapSelection.value = !wrapSelection.value
    flash(`Wrap selection ${wrapSelection.value ? 'enabled' : 'disabled'}`, '#FFCC00')
  }
})

const keyLegend = t`${bold(fg('#FFFFFF')('Key Controls:'))}
↑/↓ or j/k: Navigate items
Shift+↑/↓ or Shift+j/k: Fast scroll
Enter: Select item
F: Toggle focus
D: Toggle descriptions
S: Toggle scroll indicator
W: Toggle wrap selection
Esc: Focus the sidebar`

const status = computed(() => {
  const current = selectOptions[index.value]
  const selectionText = current
    ? `Selection: ${current.name} (${current.value}) - Index: ${index.value}`
    : 'No selection'
  const focusText = isFocused.value ? 'Select element is FOCUSED' : 'Select element is BLURRED'
  const toggles = `Scroll indicator: ${showScrollIndicator.value ? 'on' : 'off'} | Description: ${
    showDescription.value ? 'on' : 'off'
  } | Wrap: ${wrapSelection.value ? 'on' : 'off'}`

  return t`${fg('#00FF00')(selectionText)}

${fg(isFocused.value ? '#00FF00' : '#FF0000')(focusText)}

${fg('#CCCCCC')(toggles)}

${fg(lastActionColor.value)(lastAction.value)}`
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Select showcase</Text>
    <Box flexDirection="row" :gap="2" width="100%">
      <Select
        ref="select"
        v-model="index"
        :options="selectOptions"
        autofocus
        width="50%"
        :height="16"
        backgroundColor="#1e293b"
        focusedBackgroundColor="#2d3748"
        textColor="#e2e8f0"
        focusedTextColor="#f7fafc"
        selectedBackgroundColor="#3b82f6"
        selectedTextColor="#ffffff"
        descriptionColor="#94a3b8"
        selectedDescriptionColor="#cbd5e1"
        :showDescription="showDescription"
        :showScrollIndicator="showScrollIndicator"
        :wrapSelection="wrapSelection"
        :fastScrollStep="5"
        @select="onSelect"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <Text fg="#AAAAAA" :content="keyLegend" />
    </Box>
    <Text width="100%" :content="status" />
  </Box>
</template>
