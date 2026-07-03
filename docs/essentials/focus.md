# Focus Management

Only one element at a time can be **focused** — the one that receives keyboard input. Inputs and selects need focus to be typed into or navigated. Vue TermUI gives you two composables over OpenTUI's focus system: `useCurrentFocusedElement` to read which element is focused, and `useFocusManager` for an app-wide view.

::: tip No automatic Tab cycling
Unlike the web, OpenTUI does **not** cycle focus on <kbd>Tab</kbd> for you. You decide the order and which key advances it — see [Building Tab navigation](#usefocusmanager) below. This is more code, but it gives you full control over how navigation feels.
:::

## Making an element focusable

Any element joins the focus system just by being `focusable`. Interactive components (`<Input>`, `<Select>`) already are; opt a container in with `<Box :focusable="true" />`. Once focusable, an element can be focused imperatively through its backing renderable — grab it with a template ref and call `focus()` / `blur()`:

```vue
<script setup lang="ts">
import { Box, Text, computed, shallowRef, useCurrentFocusedElement } from 'vue-termui'

// The backing OpenTUI renderable. Bound to a host `<box>` the ref receives the
// renderable directly; bound to the `<Box>` component, unwrap its `$el`.
const el = shallowRef<any>(null)
const currentFocused = useCurrentFocusedElement()
const focused = computed(() => !!el.value && currentFocused.value === el.value)

function setRef(instance: any) {
  el.value = instance?.$el ?? instance ?? null
}
</script>

<template>
  <Box :ref="setRef" focusable border :borderColor="focused ? '#42b883' : '#666666'" :padding="1">
    <Text>{{ focused ? 'focused' : 'not focused' }}</Text>
  </Box>
</template>
```

`el.value.focus()` gives the element focus and `el.value.blur()` removes it. `focused` stays in sync because [`useCurrentFocusedElement`](#usecurrentfocusedelement) is reactive.

A common pattern is a reusable focusable item that exposes its controls to a parent:

```vue
<!-- MenuItem.vue -->
<script setup lang="ts">
import { Box, Text, computed, shallowRef, useCurrentFocusedElement } from 'vue-termui'

defineProps<{ label: string }>()

const el = shallowRef<any>(null)
const currentFocused = useCurrentFocusedElement()
const focused = computed(() => !!el.value && currentFocused.value === el.value)

// Let the parent drive focus and read state.
defineExpose({ focus: () => el.value?.focus(), focused })
</script>

<template>
  <Box
    :ref="(c) => (el = c?.$el ?? c ?? null)"
    focusable
    :backgroundColor="focused ? '#42b883' : undefined"
    :paddingX="1"
  >
    <Text :fg="focused ? '#0b0b0b' : '#cccccc'">{{ focused ? '›' : ' ' }} {{ label }}</Text>
  </Box>
</template>
```

## `useCurrentFocusedElement`

`useCurrentFocusedElement` returns a reactive `ShallowRef` of the element that currently holds focus, or `null` when nothing is focused. It updates whenever focus moves.

```vue
<script setup lang="ts">
import { useCurrentFocusedElement } from 'vue-termui'

const focused = useCurrentFocusedElement()
// focused.value is the currently focused renderable, or null
</script>
```

Compare it against your own element (see [above](#making-an-element-focusable)) to derive a per-element `focused` boolean.

## `useFocusManager`

`useFocusManager` gives you app-wide Tab navigation: the currently focused element (reactive, same as `useCurrentFocusedElement`), plus `focusNext()` / `focusPrevious()` that cycle through **every** focusable element in render-tree order (wrapping around), and `blur()`.

```vue
<script setup lang="ts">
import { onKeyDown, useFocusManager } from 'vue-termui'

const { focused, focusNext, focusPrevious } = useFocusManager()

// One handler, anywhere near the root, wires Tab across the whole app.
onKeyDown((key) => {
  if (key.name !== 'tab') return
  key.preventDefault()
  key.shift ? focusPrevious() : focusNext()
})
</script>
```

| Property          | Type                     | Description                                                         |
| ----------------- | ------------------------ | ------------------------------------------------------------------- |
| `focused`         | `ShallowRef<Renderable>` | The currently focused element, or `null`                            |
| `focusNext()`     | `() => void`             | Focus the next focusable in tree order, wrapping (first if none)    |
| `focusPrevious()` | `() => void`             | Focus the previous focusable in tree order, wrapping (last if none) |
| `blur()`          | `() => void`             | Clear focus from whatever element has it                            |

Elements join the cycle just by being `focusable`: interactive components (`<Input>`, `<Select>`) already are, and you opt a container in with `<Box :focusable="true" />`. The order is the render tree's depth-first order.

## Scoped navigation within a component

`useFocusManager` cycles the **whole** app. When you instead want arrow keys to move only within one list — a sidebar, a menu, a tab bar — keep an **ordered list** of that component's focusable children, track which is focused, and move on a key press. Here a parent collects child refs and moves focus with the arrow keys, committing on <kbd>Enter</kbd>:

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
