<p align="center">
  <a href="https://vue-termui.dev" target="_blank" rel="noopener noreferrer">
    <img width="180" src="https://vue-termui.dev/logo-big.svg" alt="Vue TermUI logo">
  </a>
</p>

<h1 align="center">vue-termui</h1>

<p align="center">
  <a href="https://npmx.dev/package/vue-termui"><img src="https://img.shields.io/npm/v/vue-termui.svg" alt="npm version"></a>
  <a href="https://github.com/vue-terminal/vue-termui/actions/workflows/ci.yml"><img src="https://github.com/vue-terminal/vue-termui/actions/workflows/ci.yml/badge.svg" alt="ci"></a>
</p>

<p align="center">
  Build terminal apps with Vue 3, powered by <a href="https://opentui.com/">OpenTUI</a>.
</p>

> [!IMPORTANT]
> vue-termui renders through [OpenTUI](https://opentui.com/)'s native engine, which requires FFI.
> Run your app with **Node ≥ 26.3** and `--experimental-ffi` (add
> `--disable-warning=ExperimentalWarning` to silence the notice), or use **[Bun](https://bun.sh/)**,
> which supports FFI natively.

## Install

Scaffold a new app:

```bash
npm create vue-termui@latest
```

Or add it to an existing project:

```bash
pnpm add vue-termui
```

## Usage

```vue
<!-- App.vue -->
<script setup lang="ts">
import { Box, Text, onKeyDown, useExit } from 'vue-termui'

const exit = useExit()
onKeyDown((key) => key.name === 'q' && exit())
</script>

<template>
  <Box border>
    <Text>Hello from the terminal! Press <Text bold>q</Text> to quit.</Text>
  </Box>
</template>
```

```ts
// main.ts
import { createApp } from 'vue-termui'
import App from './App.vue'

const app = await createApp(App)
app.mount()
```

Compile `.vue` files with the Vite plugin:

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import vueTermui from 'vue-termui/vite'

export default defineConfig({
  plugins: [vueTermui()],
})
```

## License

[MIT](./LICENSE)
