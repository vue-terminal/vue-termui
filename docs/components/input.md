# `<Input>`

A single-line text input, mapping to OpenTUI's input renderable. It supports `v-model` for the text value.

```vue
<script setup lang="ts">
import { Input, ref } from 'vue-termui'

const name = ref('')
</script>

<template>
  <Input v-model="name" placeholder="Your name" focus />
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

## Reacting to <kbd>Enter</kbd>

Watch for the `return` key with [`onKeyDown`](../essentials/input) — for example, to add an item and clear the field:

```vue
<script setup lang="ts">
import { Input, onKeyDown, ref } from 'vue-termui'

const draft = ref('')
const items = ref<string[]>([])

onKeyDown((key) => {
  if (key.name !== 'return') return
  if (draft.value.trim()) items.value.push(draft.value.trim())
  draft.value = ''
})
</script>

<template>
  <Input v-model="draft" placeholder="Add a todo…" focus />
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
