# Getting Started

This guide walks you through setting up a Vue TermUI project from scratch. It takes a couple of minutes and you'll end up with a live-reloading terminal app.

## Prerequisites

Vue TermUI renders through [OpenTUI](https://opentui.com/), whose native renderer is loaded over Node's FFI.

- **Node.js ≥ 26.3.0**, run with the `--experimental-ffi` flag
- A terminal (most modern terminals work great)

::: tip Why `--experimental-ffi`?
Creating the renderer calls into OpenTUI's native module through Node's foreign-function interface, which is still behind a flag. You only need it at **runtime** — the dev and start scripts below set it for you.
:::

## Installation

Install Vue TermUI and its peers with your package manager of choice:

```bash
# pnpm
pnpm add vue-termui vue
pnpm add -D vite

# npm
npm i vue-termui vue
npm i -D vite
```

`vue-termui` ships its own Vite plugin (compiling `.vue` files and launching the app), so Vite is the only build dependency you need.

## Project setup

A minimal project has three files: a Vite config, an entry, and a root component.

### `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import vueTermui from 'vue-termui/vite'

export default defineConfig({
  plugins: [vueTermui()],
})
```

The plugin compiles your SFCs, registers the terminal host tags, and — in dev — **launches your app in-process with HMR**, so running `vite` opens your terminal app directly.

### `src/App.vue`

```vue
<script setup lang="ts">
import { Box, Text, onKeyDown, useExit, ref } from 'vue-termui'

const count = ref(0)
const exit = useExit()

onKeyDown((key) => {
  if (key.name === 'up') count.value++
  if (key.name === 'down') count.value--
  if (key.name === 'q') exit()
})
</script>

<template>
  <Box border borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
    <Text bold fg="#42b883">Hello from Vue TermUI 👋</Text>
    <Text>Count: {{ count }}</Text>
    <Text fg="#888888">↑/↓ to change · q or Ctrl+C to quit</Text>
  </Box>
</template>
```

### `src/main.ts`

```ts
import { createApp } from 'vue-termui'
import App from './App.vue'

// createApp is async — it spins up the OpenTUI renderer first.
const app = await createApp(App)
app.mount()

// Keep the process alive until the user quits.
await app.waitUntilExit()
```

## Scripts

Add the run scripts to your `package.json`. Both pass the FFI flag for you:

```json
{
  "type": "module",
  "scripts": {
    "dev": "NODE_OPTIONS=--experimental-ffi vite",
    "build": "vite build",
    "start": "node --experimental-ffi dist/main.js"
  }
}
```

::: warning ESM only
Vue TermUI is ESM-only. Make sure your `package.json` has `"type": "module"`.
:::

## Run it

```bash
pnpm dev
```

Your app takes over the terminal. Edit `App.vue` and watch it **hot-reload without losing state** — just like a web app. Press <kbd>q</kbd> or <kbd>Ctrl</kbd>+<kbd>C</kbd> to quit.

To ship a single self-contained file:

```bash
pnpm build   # bundles to dist/main.js
pnpm start   # runs it
```

## What's next?

You have a running app — now learn the pieces:

- [Creating an Application](../essentials/application) — the app lifecycle in depth
- [Layout & Boxes](../essentials/layout) — arrange your UI with flexbox
- [Styling Text](../essentials/text) — colors and text attributes
- [Handling Input](../essentials/input) — keyboard and mouse
