# `<Input>`

A single-line text input, mapping to OpenTUI's input renderable. It supports `v-model` for the text value and emits `submit` when <kbd>Enter</kbd> is pressed.

```vue
<script setup lang="ts">
import { Input, ref } from 'vue-termui'

const name = ref('')

function save(value: string) {
  // ...
}
</script>

<template>
  <Input v-model="name" placeholder="Your name" focus @submit="save" />
</template>
```

An input only receives typing while it's **focused**. Pass `focus` to grab focus on mount, or manage focus yourself (see [Focus Management](../essentials/focus)).

## Props

| Prop                     | Type         | Description                             |
| ------------------------ | ------------ | --------------------------------------- |
| `modelValue`             | `string`     | Current text value (use with `v-model`) |
| `placeholder`            | `string`     | Shown while the input is empty          |
| `maxLength`              | `number`     | Maximum number of characters            |
| `focus`                  | `boolean`    | Focus the input as soon as it mounts    |
| `textColor`              | `ColorInput` | Text color                              |
| `backgroundColor`        | `ColorInput` | Background color                        |
| `focusedBackgroundColor` | `ColorInput` | Background color while focused          |

## Events

| Event               | Payload  | Fires when                          |
| ------------------- | -------- | ----------------------------------- |
| `update:modelValue` | `string` | The text changes (drives `v-model`) |
| `submit`            | `string` | <kbd>Enter</kbd> is pressed         |

## `v-model`

`v-model` is two-way: typing updates the bound ref, and changing the ref from elsewhere updates the input.

```vue
<script setup lang="ts">
import { Input, ref, watch } from 'vue-termui'

const query = ref('')
watch(query, (q) => search(q))
</script>

<template>
  <Input v-model="query" placeholder="Search…" focus />
</template>
```

## Submitting

Use `@submit` to act when the user presses <kbd>Enter</kbd> — for example, to add an item and clear the field:

```vue
<script setup lang="ts">
import { Input, ref } from 'vue-termui'

const draft = ref('')
const items = ref<string[]>([])

function add(value: string) {
  if (value.trim()) items.value.push(value.trim())
  draft.value = ''
}
</script>

<template>
  <Input v-model="draft" placeholder="Add a todo…" focus @submit="add" />
</template>
```

## Styling

```vue-html
<Input
  v-model="text"
  textColor="#ffffff"
  backgroundColor="#1e1e2e"
  focusedBackgroundColor="#2a2a3a"
/>
```
