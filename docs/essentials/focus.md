# Focus Management

Only one element at a time can be **focused** — the one that receives keyboard input. Inputs and selects need focus to be typed into or navigated. Vue TermUI gives you two composables over OpenTUI's focus system: `useFocus` for a single element, and `useFocusManager` for an app-wide view.

::: tip No automatic Tab cycling
Unlike the web, OpenTUI does **not** cycle focus on <kbd>Tab</kbd> for you. You decide the order and which key advances it — see [Building Tab navigation](#building-tab-navigation) below. This is more code, but it gives you full control over how navigation feels.
:::

## `useFocus`

`useFocus` makes a single element focusable and tracks its state. Bind the returned `ref` to the element, then read `focused` or call `focus()` / `blur()`:

```vue
<script setup lang="ts">
import { Box, Text, useFocus } from 'vue-termui'

const { ref: boxRef, focused, focus, blur } = useFocus({ autoFocus: true })
</script>

<template>
  <Box :ref="boxRef" border :borderColor="focused ? '#42b883' : '#666666'" :padding="1">
    <Text>{{ focused ? 'focused' : 'not focused' }}</Text>
  </Box>
</template>
```

### Options and return value

`useFocus(options)`:

- **`autoFocus`** (`boolean`, default `false`) — focus this element as soon as it mounts.

It returns:

| Property  | Type           | Description                                |
| --------- | -------------- | ------------------------------------------ |
| `ref`     | template ref   | Bind to the element you want focusable     |
| `focused` | `Ref<boolean>` | Whether this element currently holds focus |
| `focus()` | `() => void`   | Give this element focus                    |
| `blur()`  | `() => void`   | Remove focus from this element             |

A common pattern is a reusable focusable item that exposes its controls to a parent:

```vue
<!-- MenuItem.vue -->
<script setup lang="ts">
import { Box, Text, useFocus } from 'vue-termui'

defineProps<{ label: string }>()
const { ref: boxRef, focused, focus } = useFocus()

// Let the parent drive focus and read state.
defineExpose({ focus, focused })
</script>

<template>
  <Box :ref="boxRef" :backgroundColor="focused ? '#42b883' : undefined" :paddingX="1">
    <Text :fg="focused ? '#0b0b0b' : '#cccccc'">{{ focused ? '›' : ' ' }} {{ label }}</Text>
  </Box>
</template>
```

## `useFocusManager`

`useFocusManager` gives you the app-wide focus state — the currently focused element (reactive) plus imperative `focus()` / `blur()`:

```vue
<script setup lang="ts">
import { useFocusManager } from 'vue-termui'

const { focused, focus, blur } = useFocusManager()
</script>
```

| Property    | Type                     | Description                              |
| ----------- | ------------------------ | ---------------------------------------- |
| `focused`   | `ShallowRef<Renderable>` | The currently focused element, or `null` |
| `focus(el)` | `(el) => void`           | Focus a specific element                 |
| `blur()`    | `() => void`             | Clear focus from whatever element has it |

## Building Tab navigation

Since focus cycling is up to you, the recipe is: keep an **ordered list** of your focusable children, track which one is focused, and move on a key press. Here a parent collects child refs and moves focus with the arrow keys, committing on <kbd>Enter</kbd>:

```vue
<script setup lang="ts">
import { Box, onKeyDown, onMounted, nextTick, ref } from 'vue-termui'
import MenuItem from './MenuItem.vue'

const items = ['New file', 'Open', 'Save', 'Quit']

// Public instances of each MenuItem, collected via function refs.
const links = ref<Array<{ focus: () => void; focused: boolean } | null>>([])

function focusedIndex() {
  return links.value.findIndex((l) => l?.focused)
}
function focusAt(i: number) {
  const n = items.length
  links.value[((i % n) + n) % n]?.focus() // wraps around
}

onMounted(async () => {
  await nextTick() // wait for children to mount + register
  focusAt(0)
})

onKeyDown((key) => {
  const current = focusedIndex()
  if (current < 0) return // focus is elsewhere; ignore
  if (key.name === 'down') focusAt(current + 1)
  else if (key.name === 'up') focusAt(current - 1)
  else if (key.name === 'return') run(items[current])
})

function run(item: string) {
  /* ... */
}
</script>

<template>
  <Box flexDirection="column">
    <MenuItem
      v-for="(label, i) in items"
      :key="label"
      :ref="(el) => (links[i] = el as any)"
      :label="label"
    />
  </Box>
</template>
```

The same idea scales to a sidebar, a tab bar, or a form: an ordered list, an index, and a key that advances it. A nice touch is binding <kbd>Esc</kbd> to pull focus back to your main navigation from a focused `<Input>` or `<Select>`.

## Built-in focusable components

`<Input>` and `<Select>` are focusable out of the box and accept a `focus` prop to grab focus on mount:

```vue-html
<Input v-model="name" focus />
<Select v-model="index" :options="options" focus />
```

While focused, they handle the relevant keys themselves (typing, cursor movement, list navigation). See [`<Input>`](../components/input) and [`<Select>`](../components/select).
