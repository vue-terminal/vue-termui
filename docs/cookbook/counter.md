# Building a Counter

The "hello world" of interactive apps: a number you change with the keyboard. It shows the core loop of any Vue TermUI app — reactive state, a key handler, and a way to quit.

Here's a recording of it running in a real terminal, replayed right here in the browser:

<ClientOnly>
  <SessionPlayer src="/casts/tres.cast" />
</ClientOnly>

```vue
<script setup lang="ts">
import { Box, Text, onKeyDown, useExit, ref } from 'vue-termui'

const count = ref(0)
const exit = useExit()

onKeyDown((key) => {
  if (key.name === 'up' || key.name === '+') count.value++
  else if (key.name === 'down' || key.name === '-') count.value--
  else if (key.name === 'q') exit()
})
</script>

<template>
  <Box border borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
    <Text bold fg="#42b883">Counter</Text>
    <Text>
      Value:
      <Text bold :fg="count < 0 ? 'red' : '#42b883'">{{ count }}</Text>
    </Text>
    <Text fg="#888888">↑/↓ or +/- to change · q to quit</Text>
  </Box>
</template>
```

## How it works

- **`ref(0)`** holds the count. Because it's reactive, the template re-renders whenever it changes — and the renderer patches only the line that changed.
- **`onKeyDown`** registers a key handler scoped to this component; it's removed automatically on unmount. We branch on `key.name`.
- **`useExit`** returns the app's exit function so <kbd>q</kbd> quits cleanly (<kbd>Ctrl</kbd>+<kbd>C</kbd> always works too).
- The nested `<Text>` recolors the number based on its sign — templates compose exactly like on the web.

## Variations

Drive it from a timer instead of keys:

```vue
<script setup lang="ts">
import { Text, ref, useInterval } from 'vue-termui'

const count = ref(0)
useInterval(() => count.value++, 1000)
</script>

<template>
  <Text>Elapsed: {{ count }}s</Text>
</template>
```

Next, try wiring the counter into a multi-screen app with [Routing](../essentials/routing), or add a text field with [Forms & Inputs](./forms).
