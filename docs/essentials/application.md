# Creating an Application

Every Vue TermUI app starts with `createApp`. It mirrors Vue's own `createApp`, with one important difference: it's **asynchronous**, because it has to spin up the OpenTUI renderer first.

## `createApp`

```ts
import { createApp } from 'vue-termui'
import App from './App.vue'

const app = await createApp(App)
app.mount()
await app.waitUntilExit()
```

`createApp(rootComponent, rootProps?, rendererOptions?)`:

- **`rootComponent`** — your root component.
- **`rootProps`** — props passed to the root component (or `null`).
- **`rendererOptions`** — options forwarded to OpenTUI's renderer (see [Renderer options](#renderer-options)).

It returns a `Promise<App>`. The app is **not mounted yet** — that's deliberate, so you can install plugins and await async setup first:

```ts
const app = await createApp(App)

app.use(somePlugin)
app.use(router)
await router.isReady()

app.mount()
```

### Mounting

`app.mount()` mounts your root component into the renderer's root. Unlike on the web, you don't pass a selector — there's no DOM, just the terminal screen:

```ts
app.mount() // mounts into the terminal
```

### Keeping the process alive

A terminal app should stay running until the user quits. `app.waitUntilExit()` returns a promise that resolves when the app exits (via <kbd>Ctrl</kbd>+<kbd>C</kbd>, an exit signal, or `app.exit()`):

```ts
const app = await createApp(App)
app.mount()

await app.waitUntilExit()
// ...any cleanup after the user quits
console.log('Goodbye!')
```

## Exiting

There are several ways an app exits:

| Trigger                       | What happens                              |
| ----------------------------- | ----------------------------------------- |
| <kbd>Ctrl</kbd>+<kbd>C</kbd>  | Renderer tears down, terminal is restored |
| `app.exit()`                  | Programmatic exit                         |
| [`useExit()`](#useexit)       | Programmatic exit from inside a component |
| Process signal (e.g. SIGTERM) | Renderer tears down gracefully            |

Exiting always **restores the terminal** — cursor, screen buffer and raw mode — so the user is left with a clean prompt.

```ts
app.exit() // idempotent: safe to call more than once
```

## `useExit`

Most of the time you want to quit from _within_ a component — for example on a key press. `useExit()` returns the app's exit function:

```vue
<script setup lang="ts">
import { onKeyDown, useExit } from 'vue-termui'

const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'q') exit()
})
</script>
```

## Renderer options

The third argument to `createApp` is forwarded to OpenTUI's renderer. A few commonly useful options:

```ts
const app = await createApp(App, null, {
  // Quit automatically on Ctrl+C (default behavior).
  exitOnCtrlC: true,
  // Enable the Kitty keyboard protocol, which also reports key *releases*
  // (see `onKeyUp`). Only some terminals support it.
  useKittyKeyboard: true,
})
```

::: tip Errors don't crash your app
By default the renderer captures `console.*` output in a **console overlay** and routes uncaught component errors there instead of tearing down the terminal. A single misbehaving component won't take down the whole app. You can still set `app.config.errorHandler` to report errors elsewhere — yours takes over.
:::

## `useRenderer`

For advanced use cases you can reach the underlying OpenTUI renderer directly with `useRenderer()`. The composables in this guide (`useTerminalSize`, `onKeyDown`, focus helpers…) are thin wrappers over it, so you rarely need this — but it's there when you do.

```vue
<script setup lang="ts">
import { useRenderer } from 'vue-termui'

const renderer = useRenderer()
console.log(renderer.width, renderer.height)
</script>
```

## Importing from `vue-termui`

Vue TermUI **re-exports `@vue/runtime-core`**, so you import Vue's own APIs (`ref`, `computed`, `watch`, lifecycle hooks, `h`…) from `vue-termui` too:

```ts
import { ref, computed, watch, onMounted } from 'vue-termui'
```

::: warning Always import from `vue-termui`
Import reactivity and lifecycle APIs from `vue-termui`, **not** from `vue`. The renderer is built on a specific copy of `@vue/runtime-core`; pulling `ref`/`h` from `vue` loads a second copy and breaks component interop.
:::
