<script setup lang="ts">
// Ported from @opentui/examples src/input-demo.ts (InputRenderable form demo)
import { Box, bold, computed, fg, Input, onKeyDown, reactive, ref, t, Text } from 'vue-termui'

type FieldKey = 'name' | 'email' | 'password' | 'comment'

const fields = [
  { key: 'name', label: 'Name', placeholder: 'Enter your name...', maxLength: 50 },
  { key: 'email', label: 'Email', placeholder: 'Enter your email...', maxLength: 100 },
  { key: 'password', label: 'Password', placeholder: 'Enter password...', maxLength: 50 },
  { key: 'comment', label: 'Comment', placeholder: 'Enter a comment...', maxLength: 200 },
] as const satisfies ReadonlyArray<{
  key: FieldKey
  label: string
  placeholder: string
  maxLength: number
}>

const form = reactive<Record<FieldKey, string>>({
  name: '',
  email: '',
  password: '',
  comment: '',
})

// Which field currently holds focus (Tab/Shift+Tab cycle app-wide)
const focusedField = ref<FieldKey | null>(null)

const lastAction = ref('Welcome to the Input demo! Use Tab/Shift+Tab to navigate between fields.')
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

const validName = computed(() => form.name.length >= 2)
const validEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
const validPassword = computed(() => form.password.length >= 6)

function isValid(key: FieldKey): boolean {
  return key === 'name'
    ? validName.value
    : key === 'email'
      ? validEmail.value
      : key === 'password'
        ? validPassword.value
        : true
}

function onInput(field: (typeof fields)[number], value: string) {
  flash(`${field.label} input: "${value}"`, '#00FFFF')
}

function onChange(field: (typeof fields)[number], value: string) {
  flash(`*** ${field.label} CHANGED: "${value}" ***`, '#FF00FF', 1000)
}

function onEnter(field: (typeof fields)[number], value: string) {
  const valid = isValid(field.key)
  flash(
    `*** ${field.label} SUBMITTED: "${value}" ${valid ? '(Valid)' : '(Invalid)'} ***`,
    valid ? '#00FF00' : '#FF0000',
    1500,
  )
}

// Ctrl+C quits the playground and Tab/Esc are reserved by the shell, so only
// the reset shortcut is kept from the original demo.
onKeyDown((key) => {
  if (key.ctrl && key.name === 'r') {
    form.name = form.email = form.password = form.comment = ''
    flash('All inputs reset to empty values', '#FF00FF', 1000)
  }
})

const keyLegend = t`${bold(fg('#FFFFFF')('Key Controls:'))}
Tab/Shift+Tab: Navigate between inputs
Left/Right: Move cursor within input
Home/End: Move to start/end of input
Backspace/Delete: Remove characters
Enter: Submit current input
Ctrl+R: Reset all inputs
Esc: Focus the sidebar
Type: Enter text in focused field`

const status = computed(() => {
  const focusOf = (key: FieldKey) =>
    focusedField.value === key ? fg('#00FF00')('FOCUSED') : fg('#FF0000')('BLURRED')
  const check = (valid: boolean, hint: string) =>
    valid ? fg('#00FF00')('✓ Valid') : fg('#FF0000')(`✗ Invalid (${hint})`)
  const activeLabel = fields.find((f) => f.key === focusedField.value)?.label ?? 'None'

  return t`${bold(fg('#FFFFFF')('Input Values:'))}
Name: "${form.name}" (${focusOf('name')})
Email: "${form.email}" (${focusOf('email')})
Password: "${form.password.replace(/./g, '*')}" (${focusOf('password')})
Comment: "${form.comment}" (${focusOf('comment')})

${bold(fg('#FFAA00')(`Active Input: ${activeLabel}`))}

${bold(fg('#CCCCCC')('Validation:'))}
Name: ${check(validName.value, 'min 2 chars')}
Email: ${check(validEmail.value, 'format')}
Password: ${check(validPassword.value, 'min 6 chars')}

${fg(lastActionColor.value)(lastAction.value)}`
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Input form</Text>
    <Box flexDirection="row" :gap="2" width="100%">
      <Box flexDirection="column" width="55%">
        <Box
          v-for="field in fields"
          :key="field.key"
          flexDirection="column"
          width="100%"
          borderStyle="single"
          borderColor="#475569"
          focusedBorderColor="#FFFF00"
          :title="field.label"
        >
          <Input
            v-model="form[field.key]"
            width="100%"
            :placeholder="field.placeholder"
            :maxLength="field.maxLength"
            backgroundColor="#001122"
            textColor="#FFFFFF"
            placeholderColor="#666666"
            cursorColor="#FFFF00"
            :autofocus="field.key === 'name'"
            @focus="focusedField = field.key"
            @blur="focusedField === field.key && (focusedField = null)"
            @input="onInput(field, $event)"
            @change="onChange(field, $event)"
            @enter="onEnter(field, $event)"
          />
        </Box>
      </Box>
      <Box width="40%" :paddingTop="1">
        <Text fg="#AAAAAA" :content="keyLegend" />
      </Box>
    </Box>
    <Text width="100%" :content="status" />
  </Box>
</template>
