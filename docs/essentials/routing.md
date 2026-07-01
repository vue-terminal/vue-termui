# Routing

A larger terminal app often has multiple "screens" — a dashboard, a settings page, a detail view. Because Vue TermUI is real Vue, you can use [Vue Router](https://router.vuejs.org/) to navigate between them, with a couple of terminal-specific adjustments.

## Setup

Install Vue Router and use a **memory history** — there's no URL bar in a terminal, so navigation is kept in memory:

```bash
pnpm add vue-router
```

```ts
// src/router.ts
import { createMemoryHistory, createRouter } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Settings from './pages/Settings.vue'

export const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/settings', component: Settings },
  ],
})
```

Install the router on the app and wait for it to be ready **before mounting**, so the first frame already shows the matched component. Because a memory history has no initial route, push a start location first — use the `VUE_TERMUI_START_LOCATION` global so navigation survives dev full reloads:

```ts
// src/main.ts
import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'

const app = await createApp(App)
app.use(router)
await router.push(VUE_TERMUI_START_LOCATION)
await router.isReady()
app.mount()
await app.waitUntilExit()
```

::: tip Start location
`VUE_TERMUI_START_LOCATION` is a global provided by vue-termui. It defaults to `/`, can be overridden with an environment variable of the same name (`VUE_TERMUI_START_LOCATION=/settings vite`), and in dev it is set to the current route before each full reload — so editing a non-HMR file (the entry, the router, a plain `.ts`) keeps you on the screen you were viewing instead of jumping back to `/`.
:::

Render the active page with `<RouterView>` somewhere in your layout:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { Box } from 'vue-termui'
import { RouterView } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <Box flexDirection="row" :gap="1" :padding="1">
    <Sidebar />
    <Box :flexGrow="1">
      <RouterView />
    </Box>
  </Box>
</template>
```

## Navigate imperatively

::: warning `<RouterLink>` does not work
`<RouterLink>` renders a DOM `<a>` element, which the terminal renderer can't mount. Navigate **imperatively** with the router instead — usually from a key handler.
:::

```vue
<script setup lang="ts">
import { onKeyDown } from 'vue-termui'
import { useRouter } from 'vue-router'

const router = useRouter()

onKeyDown((key) => {
  if (key.name === 's') router.push('/settings')
  if (key.name === 'h') router.push('/')
})
</script>
```

This pairs naturally with [Focus Management](./focus): build a focusable list of menu items, and on <kbd>Enter</kbd> call `router.push(item.to)`.

## File-based routing

If you prefer file-based routes, [`unplugin-vue-router`](https://uvr.esm.dev/) works too. Two things to keep in mind for terminal apps:

1. Register its Vite plugin **before** `vueTermui()` (which provides the Vue SFC plugin).
2. Import routes **synchronously** (`importMode: 'sync'`) — a single CLI bundle needs all routes inlined, and synchronous imports avoid Vite's browser-only dynamic-import preload helper.

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'
import vueTermui from 'vue-termui/vite'

export default defineConfig({
  plugins: [
    VueRouter({
      routesFolder: 'src/pages',
      importMode: 'sync',
    }),
    vueTermui(),
  ],
})
```

Then build the router from the generated routes:

```ts
// src/router.ts
import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

export const router = createRouter({
  history: createMemoryHistory(),
  routes,
})
```
