# vue-termui

Build terminal apps with Vue 3, rendered via [OpenTUI](https://opentui.com/).

Ground-up rewrite. The old implementation (custom renderer + yoga) lives in
`old/` and is being stripped out progressively.

## Commands

```bash
pnpm build                                 # build core with tsdown
pnpm test                                  # full suite: build + coverage + typecheck
pnpm test:cov                              # vitest with coverage
pnpm exec vitest run src/renderer/nodeOps.spec.ts  # single test file
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
  `text` → `TextRenderable`, `input` → `InputRenderable`, `select` →
  `SelectRenderable`. A lone string child of `<text>` goes through the
  `setElementText` fast path (`.content =`); array/interpolated text uses
  `TextNodeRenderable`. Comments are invisible `BoxRenderable` anchors.
- **Text nodes only belong inside `<text>`.** OpenTUI's `Box.add` requires a
  layout node (`getLayoutNode`), which `TextNodeRenderable` lacks. But Vue creates
  Fragment boundary anchors as empty text nodes and inserts them into the
  container — so `v-for`, multi-root components and `<RouterView>` put text nodes
  inside a `<box>`. `nodeOps` therefore substitutes an invisible, out-of-flow
  `BoxRenderable` anchor for any text node placed in a non-`<text>` parent, and
  maps between the text node and its stand-in (per-app `WeakMap`s) for
  `insert`/`remove`/`parentNode`/`nextSibling`. Without this, any `v-for` throws
  `getLayoutNode is not a function`.
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

#### Building a component (`Input`/`Select` are the templates)

- **Always a `FunctionalComponent<Props, Emits>`** — even interactive ones. No
  `defineComponent`/`setup`/`onMounted`/`watch`/`shallowRef`. The explicit
  `const` type satisfies `isolatedDeclarations`; add `.displayName`, runtime
  `.props` (Boolean coercion + extracts real props from `attrs`).
- **Fallthrough for native options**: spread `...attrs` so only _set_ props reach
  the renderable. **Never forward `undefined`** — it clobbers renderable defaults
  (e.g. `Input.maxLength` defaults to 1000; `undefined` drops all typed input).
- **`v-model` / outside→renderable sync rides the prop path** — pass the mapped
  prop explicitly (`value: modelValue`, `selectedIndex: modelValue`). `patchProp`
  assigns `el[key]` only when it changes (Vue skips unchanged props) and the
  OpenTUI setter is idempotent, so **no `watch` is needed**. Verify the setter is
  silent/guarded (e.g. `selectedIndex` setter doesn't emit, unlike
  `setSelectedIndex()`) or you'll loop.
- **Mount-shaped side effects go in a function `ref`** (listeners, initial
  `focus`) — functional components have no lifecycle. Dedupe with a module
  `WeakSet<Renderable>` so re-invocation on updates doesn't double-wire.
- **Consume the event payload**, don't re-query — OpenTUI emits it
  (`selectionChanged`/`itemSelected` → `(index, option)`).
- **No runtime `emits` validators** — the typed `Emits` generic documents
  payloads; `emit` resolves listeners without a `.emits` object.
- **`Omit` OpenTUI options you don't honor**: leaked/dead ones (`Input` omits the
  `onSubmit` it inherits from Textarea but never fires) and ones you manage
  yourself (`Select` omits `options`/`selectedIndex`). Don't invent semantics —
  `Input` has **no** submit event (a form concept); react to Enter via `onKeyDown`.
- `Textarea` (`TextareaRenderable`) is a multi-line editor: `modelValue` **seeds**
  the buffer via the renderable's one-time `initialValue` setter (so it rides the
  prop path yet never clobbers cursor/undo on reassignment — an editor owns its
  text), and edits emit `update:modelValue` via the `onContentChange` handler
  (read `plainText`; `ContentChangeEvent` is empty). Unlike `Input`, submit **is**
  real here: Enter → newline, Meta/Cmd+Enter → `submit` (OpenTUI's default
  keybinding); the component owns `onSubmit` and re-emits it as `submit` with the
  text. To reset the editor, remount it with a `:key`.
- `ProgressBar` is a `Box`+`Text` composite (OpenTUI has no native progress bar).
- `Link` / `TextTransform` are NOT ported yet — they need TextNode-with-link/
  transform support threaded through `nodeOps` (text-node children don't carry
  per-node link/style). Tracked in `todos.json` (phase 7).

### Composables (`src/composables/`)

Thin reactive wrappers over the renderer; all clean up via `onScopeDispose`.

- `onKeyDown`/`onKeyUp` over `renderer.keyInput` (`keypress`/`keyrelease`). The
  public `KeyEvent` type is defined locally — OpenTUI's `KeyEvent` is **not**
  exported from the package root. Mouse has no global stream: use per-element
  `onMouse*` props (forwarded natively by `Box`).
- `onResize`/`useTerminalSize` (dims read live off `renderer.width/height`),
  `useTitle` (`setTerminalTitle`, reset on unmount).
- `useInterval`/`useTimeout` — pure timers with scope cleanup.
- `useFocus` / `useFocusManager`. OpenTUI has **no** global Tab cycling — apps
  manage their own ordered list and call `focus()`. `useFocus().ref` is a
  **function ref**, not a ref object: `<script setup>` unwraps a destructured
  composable ref used in `:ref="x"` (compiles to `ref: x.value` → `null`), so a
  plain ref never binds. A function passes through untouched and forwards through
  component wrappers (`<Box :ref>`) in both SFCs and render fns. Read the element
  via the separate `element` ref if needed.

### Authoring & DX tooling

- SFCs (`.vue`) are compiled by `vue-termui/vite` (`src/vite.ts`); render-function
  components (`.ts` with `h()`) work with no build at all.
- **No auto-import / component resolver.** Import components and composables
  explicitly from `vue-termui` — clearer, fully typed, and avoids maintaining
  unplugin magic against the dev server's runnable-`ssr` module runner. (Decision
  for phase 8; revisit only if the explicit-import friction becomes real.)
- New host tags must be added in BOTH `nodeOps.createElement` and the vite
  plugin's `HOST_TAGS` set.

Built with tsdown (`tsdown.config.ts`), outputs ESM to `dist/`. oxc toolchain:
oxlint for linting, oxfmt for formatting.
