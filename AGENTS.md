# vue-termui

Build terminal apps with Vue 3, rendered via [OpenTUI](https://opentui.com/).

Ground-up rewrite. The old implementation (custom renderer + yoga) lives in
`old/` and is being stripped out progressively.

## Commands

```bash
pnpm build                                 # build core with tsdown
pnpm test                                  # full suite: build + coverage + typecheck
pnpm test:cov                              # vitest with coverage
pnpm exec vitest run src/useHello.spec.ts  # single test file
pnpm lint                                  # oxlint
pnpm lint:fix                              # oxlint with auto-fix
pnpm test:types                            # tsc type checking
pnpm --filter playground dev               # run the playground (OpenTUI)
```

## Runtime

OpenTUI's native renderer is loaded over FFI. Creating a renderer
(`createCliRenderer`) requires **Node.js >= 26.3.0** with `--experimental-ffi`.
Plain imports of `@opentui/core` do not need FFI. The playground `dev` script
already passes `--experimental-ffi`.

Tests that build a renderer (e.g. `@opentui/core/testing`'s `createTestRenderer`)
also need FFI, so `test:cov` / `dev` set `NODE_OPTIONS=--experimental-ffi`
(vitest's `poolOptions.forks.execArgv` did **not** propagate the flag to workers;
`NODE_OPTIONS` does). Such specs run under the `node` environment via a
`// @vitest-environment node` header (the suite default is `happy-dom`).

## Important

Always keep this file up to date when project commands, structure, or tooling change.

## Architecture

- Root package `vue-termui` is the core library. `src/index.ts` re-exports from
  `src/*.ts`. Tests co-located as `*.spec.ts`; type tests as `*.test-d.ts`.
- `playground/` is a workspace package depending on the core via `workspace:*`.
  It imports **only** from `vue-termui` (no direct `@opentui/core` or `vue`).
- `old/` holds the previous monorepo, kept for reference while migrating.

### Custom renderer (`src/renderer/`)

- `vue-termui` is a Vue custom renderer (`@vue/runtime-core`'s `createRenderer`)
  over OpenTUI. `nodeOps.ts` maps Vue tree mutations to OpenTUI `Renderable`
  mutations; `index.ts` exposes `createApp` (async — it awaits `createCliRenderer`,
  then mounts the Vue root into `renderer.root`).
- Host element tags are lowercase and internal: `box` → `BoxRenderable`,
  `text` → `TextRenderable`. A lone string child of `<text>` goes through the
  `setElementText` fast path (`.content =`); array/interpolated text uses
  `TextNodeRenderable`. Comments are invisible `BoxRenderable` anchors.
- `@opentui/core` is a private dependency — never re-exported.
- `vue-termui` **re-exports `@vue/runtime-core`** so apps get `h`,
  `defineComponent`, `ref`, etc. from the _same_ runtime-core instance the
  renderer is built on. Import these from `vue-termui`, never from `vue`
  (a second runtime-core copy breaks vnode/instance interop).

### Components (`src/components/`)

- Public components are **unprefixed**: `Box`, `Text`, `Newline` (the old
  `Tui`-prefix is dropped — no DOM clash in a terminal). They are thin wrappers
  over the `box`/`text` host tags. The lowercase host tags still work directly
  in templates (the vite plugin registers them as custom elements).
- `Box` is a passthrough functional component: OpenTUI's `BoxRenderable` owns
  layout/border/padding/margin natively, so {@link BoxProps} forward unchanged.
- `Text` folds its boolean style props (`bold`, `italic`, `underline`, `dim`,
  `strikethrough`, `inverse`, `blink`) into OpenTUI's single `attributes`
  bitmask; `fg`/`bg`/`wrap` map to `fg`/`bg`/`wrapMode`. Content is the slot.
- Components are authored as explicitly-typed `FunctionalComponent`s (not
  `defineComponent`) so `isolatedDeclarations` is satisfied without hand-writing
  the `DefineComponent` return type; runtime `.props` give Boolean coercion.

Built with tsdown (`tsdown.config.ts`), outputs ESM to `dist/`. oxc toolchain:
oxlint for linting, oxfmt for formatting.
