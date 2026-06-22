# What is Vue TermUI?

Vue TermUI lets you build **terminal user interfaces** (TUIs) with Vue 3. Instead of rendering to the DOM, your components render to the terminal — with real flexbox layouts, styled text, keyboard and mouse input, and focus management.

If you know Vue, you already know Vue TermUI. You write Single-File Components, use the Composition API, `ref`s and `computed`s, slots, `v-if`/`v-for` and `v-model` — and they all work, in your terminal.

```vue
<script setup lang="ts">
import { Box, Text, useInterval, ref } from 'vue-termui'

const count = ref(0)
useInterval(() => count.value++, 1000)
</script>

<template>
  <Box border borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Uptime: {{ count }}s</Text>
  </Box>
</template>
```

## What is a terminal application?

A terminal application is a program that runs inside a terminal and draws a **text-based interface** the user interacts with — think [`htop`](https://htop.dev/), [`lazygit`](https://github.com/jesseduffield/lazygit) or [`k9s`](https://k9scli.io/). Unlike a one-shot CLI command that prints and exits, a TUI stays on screen, reacts to keystrokes, and re-renders as its state changes.

Building one by hand means juggling ANSI escape codes, cursor movement, raw input parsing and manual layout math. Vue TermUI abstracts all of that away behind components and composables.

## How it works

Vue TermUI is a **Vue custom renderer** built on top of [OpenTUI](https://opentui.com/), a native, high-performance terminal renderer.

- Your components map to OpenTUI _renderables_ — `<Box>` becomes a flexbox container, `<Text>` becomes styled text, and so on.
- OpenTUI handles the heavy lifting natively: layout (real flexbox), drawing, the alternate screen buffer, and input.
- Vue handles what it's best at: reactivity, components, and a declarative template.

Because it's a genuine custom renderer (not string concatenation), updates are **diffed and patched** just like on the web — only what changed is redrawn.

::: tip This is a rewrite
Vue TermUI is a ground-up rewrite on top of [OpenTUI](https://opentui.com/). If you used an earlier version with `TuiBox`, `onKeyData` and the `create-vue-termui` scaffold, the API has changed — this documentation covers the new, OpenTUI-based version.
:::

## When should I use it?

Reach for Vue TermUI when you want to build a **rich, interactive terminal app** and would rather use components and reactivity than wrangle escape codes:

- Dashboards and monitors
- Interactive wizards and forms
- Dev tools and project scaffolders
- Anything that benefits from layout, live updates, and keyboard navigation

## When should I _not_ use it?

Vue TermUI is aimed at _interfaces_, not simple prompts or log output. For those, lighter-weight tools are a better fit:

- [enquirer](https://github.com/enquirer/enquirer) / [prompts](https://github.com/terkelg/prompts) — quick interactive prompts
- [ora](https://github.com/sindresorhus/ora) — spinners
- [chalk](https://github.com/chalk/chalk) — coloring plain output

Nothing stops you from building those with Vue TermUI — but if all you need is a yes/no question, the abstraction isn't worth it.

## Next steps

- [Getting Started](./getting-started) — create your first app
- [Creating an Application](../essentials/application) — `createApp`, mounting and exiting
- [Built-in Components](../components/) — the component reference
