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

There is no global mouse stream. Instead, mouse events are delivered **per element** — attach a handler to a `<Box>` and OpenTUI routes the event to it natively. The handlers are renderable _properties_ (`onMouseDown`, `onMouseUp`, …), so bind them with `:onMouseDown` rather than the `@mousedown` event shorthand:

```vue
<script setup lang="ts">
import { Box, Text, ref } from 'vue-termui'
const clicks = ref(0)
</script>

<template>
  <Box border :padding="1" :onMouseDown="() => clicks++">
    <Text>Clicked {{ clicks }} times</Text>
  </Box>
</template>
```

::: warning Use the prop binding, not `@mousedown`
OpenTUI looks for camelCase properties like `onMouseDown`. Vue's `@mousedown` shorthand compiles to the all-lowercase `onMousedown`, which won't match — bind the property explicitly with `:onMouseDown="handler"`.
:::

Available handlers include `onMouseDown`, `onMouseUp`, `onMouseMove`, `onMouseOver`, `onMouseOut`, `onMouseDrag`, `onMouseDrop` and `onMouseScroll`. Because the handler is on the element, you know exactly _which_ box was interacted with — no hit-testing of global coordinates required.

## Tips

- Put global shortcuts (quit, help, navigation) in a top-level component so they're always active.
- Use [Focus Management](./focus) to route keys to the right widget — e.g. an `<Input>` should receive typing only while it's focused.
- Call `key.preventDefault()` when you've handled a key and don't want it to bubble (for example, to stop a focused widget from also reacting).
