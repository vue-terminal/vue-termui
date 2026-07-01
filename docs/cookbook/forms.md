# Forms & Inputs

A small form ties together [`<Input>`](../components/input), `v-model`, focus, and a live [`<ProgressBar>`](../components/progress-bar) — the building blocks of any data-entry screen.

```vue
<script setup lang="ts">
import { Box, Input, ProgressBar, Text, ref, computed } from 'vue-termui'

const name = ref('')
const max = 20
const filled = computed(() => Math.min(name.value.length, max))
</script>

<template>
  <Box flexDirection="column" :padding="1" :gap="1" border borderStyle="rounded">
    <Text bold fg="#42b883">What is your name?</Text>

    <!-- `focus` grabs focus on mount, so typing flows straight into the input. -->
    <Input v-model="name" placeholder="Type here…" :maxLength="max" focus />

    <Box flexDirection="row" :gap="1">
      <ProgressBar :value="filled" :max="max" :width="max" />
      <Text fg="#888888">{{ filled }}/{{ max }}</Text>
    </Box>

    <Text v-if="name">Hello, {{ name }}! 👋</Text>
    <Text fg="#888888">Esc to leave the field · Ctrl+C to quit</Text>
  </Box>
</template>
```

## What's going on

- **`v-model`** binds the input's text to `name`. Typing updates the ref; the rest of the template reacts.
- **`focus`** focuses the input on mount, so the user can type immediately. An input only receives keys while focused.
- **The progress bar is derived state** — `filled` is a `computed` from `name.length`, so the bar fills as the user types.

## Submitting

Watch for the <kbd>Enter</kbd> (`return`) key with `onKeyDown` — here we collect a list of todos, clearing the field each time:

```vue
<script setup lang="ts">
import { Box, Input, Text, onKeyDown, ref } from 'vue-termui'

const draft = ref('')
const todos = ref<string[]>([])

onKeyDown((key) => {
  if (key.name !== 'return') return
  const text = draft.value.trim()
  if (!text) return
  todos.value.push(text)
  draft.value = '' // clear the field
})
</script>

<template>
  <Box flexDirection="column" :gap="1" :padding="1" border>
    <Input v-model="draft" placeholder="Add a todo and press Enter…" focus />
    <Text v-for="(todo, i) in todos" :key="i">• {{ todo }}</Text>
    <Text v-if="!todos.length" fg="#888888">No todos yet.</Text>
  </Box>
</template>
```

## Multiple fields

For more than one field, manage focus so <kbd>Tab</kbd>/<kbd>Esc</kbd> move between them — keep an ordered list of fields and focus the next one. See [Focus Management → Building Tab navigation](../essentials/focus#building-tab-navigation) for the full pattern, and [`<Select>`](../components/select) when a field is a choice from a list rather than free text.
