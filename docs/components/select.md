# `<Select>`

A scrollable single-choice list, mapping to OpenTUI's select renderable. `v-model` binds the **highlighted index**; `select` fires when the user commits a choice with <kbd>Enter</kbd>.

```vue
<script setup lang="ts">
import { Select, ref } from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const options: SelectOption[] = [
  { name: 'Vue', description: 'The progressive framework' },
  { name: 'OpenTUI', description: 'Native terminal renderer' },
  { name: 'vue-termui', description: 'Vue 3 in the terminal' },
]

const index = ref(0)

function onPick(option: SelectOption | null, i: number) {
  // ...
}
</script>

<template>
  <Select v-model="index" :options="options" showDescription focus @select="onPick" />
</template>
```

While focused, <kbd>↑</kbd> / <kbd>↓</kbd> move the highlight and <kbd>Enter</kbd> commits. Pass `focus` to focus on mount.

## Props

| Prop              | Type             | Default | Description                                 |
| ----------------- | ---------------- | ------- | ------------------------------------------- |
| `options`         | `SelectOption[]` | `[]`    | The choices to display                      |
| `modelValue`      | `number`         | `0`     | Index of the highlighted option (`v-model`) |
| `focus`           | `boolean`        | `false` | Focus the list as soon as it mounts         |
| `showDescription` | `boolean`        | —       | Show each option's description              |
| `wrapSelection`   | `boolean`        | —       | Wrap around when navigating past the ends   |

### `SelectOption`

```ts
interface SelectOption {
  name: string // label shown for the option
  description?: string // secondary text (shown when showDescription)
  value?: unknown // arbitrary value you associate with the option
}
```

## Events

| Event               | Payload                                         | Fires when                        |
| ------------------- | ----------------------------------------------- | --------------------------------- |
| `update:modelValue` | `number`                                        | The highlight moves (`v-model`)   |
| `select`            | `(option: SelectOption \| null, index: number)` | <kbd>Enter</kbd> commits a choice |

## Reading the choice

`v-model` tracks the _highlighted_ option as the user navigates; `@select` tells you what they _committed_. Use whichever fits:

```vue
<script setup lang="ts">
import { Select, ref, computed } from 'vue-termui'
import type { SelectOption } from 'vue-termui'

const options: SelectOption[] = [
  { name: 'Small', value: 'sm' },
  { name: 'Medium', value: 'md' },
  { name: 'Large', value: 'lg' },
]

const index = ref(0)
const highlighted = computed(() => options[index.value])
const chosen = ref<SelectOption | null>(null)
</script>

<template>
  <Select v-model="index" :options="options" focus @select="(o) => (chosen = o)" />
  <Text>Highlighted: {{ highlighted?.name }}</Text>
  <Text v-if="chosen">Chosen: {{ chosen.name }} ({{ chosen.value }})</Text>
</template>
```
