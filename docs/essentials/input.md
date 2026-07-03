# Handling Input

Interactive terminal apps live and die by their input handling. Vue TermUI gives you composables for global keyboard events, and forwards per-element mouse events through `<Box>`.

## Keyboard

`onKeyDown` registers a handler that runs on every key press while the calling component is mounted. The listener is **cleaned up automatically** when the component unmounts:

```vue
<script setup lang="ts">
import { onKeyDown, useExit, ref } from 'vue-termui'

const exit = useExit()
const last = ref('')

onKeyDown((key) => {
  last.value = key.name
  if (key.name === 'q' || (key.ctrl && key.name === 'c')) exit()
})
</script>

<template>
  <Text>Last key: {{ last }}</Text>
</template>
```

### The `KeyEvent`

Each handler receives a parsed `KeyEvent`:

| Field               | Type      | Description                                                 |
| ------------------- | --------- | ----------------------------------------------------------- |
| `name`              | `string`  | Normalized key name: `'a'`, `'return'`, `'escape'`, `'up'`… |
| `ctrl`              | `boolean` | Ctrl held                                                   |
| `meta`              | `boolean` | Meta (Command/Windows) held                                 |
| `shift`             | `boolean` | Shift held                                                  |
| `option`            | `boolean` | Alt/Option held                                             |
| `sequence`          | `string`  | The raw escape sequence that produced the event             |
| `eventType`         | `string`  | `'press'`, `'release'` or `'repeat'`                        |
| `preventDefault()`  | `fn`      | Mark handled so OpenTUI stops propagating it                |
| `stopPropagation()` | `fn`      | Stop the event reaching further handlers                    |

### Matching keys

Check `key.name` (and the modifier booleans) to branch:

```ts
onKeyDown((key) => {
  if (key.name === 'up') moveUp()
  else if (key.name === 'down') moveDown()
  else if (key.ctrl && key.name === 's') save()
  else if (key.name === 'return') submit()
})
```

Common names include `return`, `escape`, `tab`, `space`, `backspace`, `delete`, the arrows `up` / `down` / `left` / `right`, and single characters like `a`, `1`, `?`.

### Key releases

`onKeyUp` fires on key _release_. This requires the **Kitty keyboard protocol**, which only some terminals support and which you opt into via the renderer config:

```ts
// main.ts
const app = await createApp(App, null, { useKittyKeyboard: true })
```

```ts
import { onKeyUp } from 'vue-termui'
onKeyUp((key) => console.log('released', key.name))
```

On terminals without Kitty support, only presses are reported and `onKeyUp` never fires.

### Removing a listener early

Both composables return a function that removes the listener before unmount, if you need it:

```ts
const stop = onKeyDown((key) => {
  /* ... */
})
// later
stop()
```

## Mouse

There is no global mouse stream. Instead, mouse events are delivered **per element** — attach a handler to a `<Box>` (or any component) and OpenTUI routes the event to it natively:

```vue
<script setup lang="ts">
import { Box, Text, ref } from 'vue-termui'
const clicks = ref(0)
</script>

<template>
  <Box border :padding="1" @mouseDown="clicks++">
    <Text>Clicked {{ clicks }} times</Text>
  </Box>
</template>
```

::: warning Use camelCase event names
OpenTUI listeners are camelCase — `@mouseDown`, `@keyDown`. The all-lowercase `@mousedown` / `@keydown` compile to `onMousedown` / `onKeydown`, which don't match. Stick to camelCase (or bind the property directly with `:onMouseDown="handler"`).
:::

Available handlers include `@mouseDown`, `@mouseUp`, `@mouseMove`, `@mouseOver`, `@mouseOut`, `@mouseDrag`, `@mouseDrop` and `@mouseScroll`. Because the handler is on the element, you know exactly _which_ box was interacted with — no hit-testing of global coordinates required.

## Event modifiers

`@keyDown` and the `@mouse*` events on components support Vue-style modifiers, so you can filter and manage events declaratively instead of branching inside the handler. This needs the [`vue-termui` Vite plugin](./application), which teaches the compiler to apply them against terminal events.

```vue
<template>
  <!-- fires only for Ctrl+C -->
  <Box @keyDown.ctrl.c="quit" />

  <!-- key-name modifiers; OpenTUI's names are accepted, plus friendly aliases -->
  <Box @keyDown.enter="submit" @keyDown.esc="cancel" />

  <!-- mouse button + event flow -->
  <Box @mouseDown.right="openMenu" @mouseDown.stop.prevent="select" />
</template>
```

::: tip Element key events need focus
Unlike the global [`onKeyDown`](#keyboard) composable, `@keyDown` on an element only fires while that element is **focused** — see [Focus Management](./focus).
:::

The supported modifiers:

| Kind          | Modifiers                                                                         | Effect                                                                 |
| ------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| System chords | `.ctrl`, `.shift`, `.alt` (`.option`), `.meta` (`.cmd`)                           | Fire only while the chord is held                                      |
| Exact chord   | `.exact`                                                                          | Fire only when _exactly_ the listed system modifiers are held          |
| Key names     | `.enter`, `.esc`, `.space`, `.tab`, `.up`/`.down`/`.left`/`.right`, `.a`, `.1`, … | Fire only when `key.name` matches (Enter is `return`, Esc is `escape`) |
| Mouse buttons | `.left`, `.middle`, `.right`                                                      | Fire only for that button                                              |
| Event flow    | `.stop`, `.prevent`                                                               | Call `stopPropagation()` / `preventDefault()` once the guard passes    |

Chain them freely (`@keyDown.ctrl.shift.k`, `@mouseDown.stop.left`). Multiple key names on one binding match any of them (`@keyDown.enter.esc`). The DOM-only `.self`, `.once`, `.capture` and `.passive` modifiers have no terminal equivalent and are ignored.

## Tips

- Put global shortcuts (quit, help, navigation) in a top-level component so they're always active.
- Use [Focus Management](./focus) to route keys to the right widget — e.g. an `<Input>` should receive typing only while it's focused.
- Call `key.preventDefault()` when you've handled a key and don't want it to bubble (for example, to stop a focused widget from also reacting).
