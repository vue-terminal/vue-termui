# Composables & Reactivity

Vue TermUI ships a small set of composables that wrap the renderer in a reactive, auto-cleaning way. They follow Vue conventions: call them in `setup`, and they tear down on unmount.

## Reactivity comes from Vue

Everything you know about Vue reactivity works unchanged — `ref`, `reactive`, `computed`, `watch`, `watchEffect`, and the lifecycle hooks. Import them from `vue-termui`:

```ts
import { ref, computed, watch, onMounted } from 'vue-termui'
```

::: warning Import from `vue-termui`, not `vue`
Vue TermUI re-exports `@vue/runtime-core`. Importing `ref`/`computed`/`h` from `vue` instead loads a second copy of the runtime and breaks component interop. Always import from `vue-termui`.
:::

When reactive state changes, your components re-render and the renderer patches only what changed — exactly like on the web.

## Timers

`useInterval` and `useTimeout` are timers tied to the component's lifetime. They're cleared automatically when the component unmounts, so you never leak a `setInterval`:

```vue
<script setup lang="ts">
import { ref, useInterval } from 'vue-termui'

const seconds = ref(0)
useInterval(() => seconds.value++, 1000)
</script>

<template>
  <Text>Uptime: {{ seconds }}s</Text>
</template>
```

```ts
import { useTimeout } from 'vue-termui'

useTimeout(() => {
  /* runs once, 3s after mount */
}, 3000)
```

Both return a function to stop the timer early:

```ts
const stop = useInterval(tick, 16)
// later
stop()
```

## Terminal size

`useTerminalSize` returns reactive `width` and `height` refs that update whenever the terminal is resized:

```vue
<script setup lang="ts">
import { useTerminalSize } from 'vue-termui'

const { width, height } = useTerminalSize()
</script>

<template>
  <Text>{{ width }}×{{ height }}</Text>
</template>
```

If you only need to _react_ to resizes (rather than read the size), use `onResize`, which fires with the new dimensions and cleans up on unmount:

```ts
import { onResize } from 'vue-termui'

onResize((width, height) => {
  console.log('resized to', width, height)
})
```

## Terminal title

`useTitle` sets the terminal window/tab title. It accepts a string, a ref, or a getter, updates reactively, and resets the title to empty when the component unmounts:

```ts
import { ref, useTitle } from 'vue-termui'

const project = ref('my-app')
useTitle(() => `${project.value} — dashboard`)
```

## Cleanup, for free

Every composable here registers its cleanup on the current [effect scope](https://vuejs.org/api/reactivity-advanced.html#effectscope), which is the component's setup scope. That means listeners and timers are removed when the component unmounts — no manual `onUnmounted` needed. The same is true of `onKeyDown` / `onKeyUp` ([Handling Input](./input)) and the focus composables ([Focus Management](./focus)).

## Summary

| Composable                      | Returns / does                                      |
| ------------------------------- | --------------------------------------------------- |
| `useInterval(fn, ms)`           | Repeating timer; returns `stop()`                   |
| `useTimeout(fn, ms)`            | One-shot timer; returns `cancel()`                  |
| `useTerminalSize()`             | `{ width, height }` reactive refs                   |
| `onResize(fn)`                  | Runs `fn(width, height)` on resize; returns remover |
| `useTitle(title)`               | Sets the terminal title reactively                  |
| `useExit()`                     | Returns a function that exits the app               |
| `useRenderer()`                 | The underlying OpenTUI renderer (advanced)          |
| `useFocus()`                    | Make one element focusable ([docs](./focus))        |
| `useFocusManager()`             | App-wide focus state ([docs](./focus))              |
| `onKeyDown(fn)` / `onKeyUp(fn)` | Keyboard listeners ([docs](./input))                |
