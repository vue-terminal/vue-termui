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
pnpm --filter playground play              # build + run; pass a route: node dist/main.js /demos/fractal
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

Doc comments: say what a thing is _for_, not how it works — short and stable over exhaustive and quick to go stale. Let the code/types carry the detail.

## Architecture

- Root package `vue-termui` is the core library. `src/index.ts` re-exports from
  `src/*.ts`. Tests co-located as `*.spec.ts`; type tests as `*.test-d.ts`.
- `packages/three/` is `@vue-termui/three`: three.js WebGPU scenes rendered
  into the terminal (see its section below).
- `playground/` is a workspace package depending on the core via `workspace:*`.
  It imports **only** from `vue-termui` (no direct `@opentui/core` or `vue`);
  3D pages may also import `@vue-termui/three` and `three`.
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

#### Adding a new native component (research recipe)

Wrapping an OpenTUI renderable (e.g. `TabSelect`, done as the template). Don't re-research — follow this:

1. **Find the renderable's API.** List exports:
   `node --input-type=module -e "import * as c from '@opentui/core'; console.log(Object.keys(c).filter(k => /Foo/i.test(k)))"`.
   Read the types in `node_modules/.pnpm/@opentui+core@*/node_modules/@opentui/core/renderables/<Name>.d.ts`
   — it has the `*RenderableOptions`, the option type (`{ name, description, value? }`), and the
   `*RenderableEvents` enum. The **implementation is bundled** in that package's `index.js` (no
   per-renderable `.js`); `grep -n "setSelectedIndex\|this.emit\|selectCurrent" index.js` to read behavior.
2. **Decide how the model syncs in.** Check whether the renderable exposes a **property setter**
   (like `SelectRenderable.selectedIndex`, silent) → ride the prop path, no `watch`. If it only has
   **`setX()` methods** (like `TabSelectRenderable.setSelectedIndex()`, and there's no `selectedIndex`
   option/setter) → seed on `onMounted` and drive changes with a `watch` on the prop. Confirm the setter
   that fires events (`setSelectedIndex` emits `selectionChanged`) vs. the silent one, and guard the
   listener (`if (index !== props.modelValue)`) so it can't loop.
3. **Copy the closest sibling.** `Select` is the template for list/`v-model`+`select` widgets. Mirror its
   `props`/`emits`/`onMounted` shape; narrow `options` to a local option type; `Omit` native options you
   manage (`options`, and `selectedIndex` if the prop path doesn't apply).
4. **Files to touch (all of them):** `src/components/<Name>.ts` + co-located `.spec.ts` (tests **first**,
   watch them fail); host tag in **both** `nodeOps.createElement`'s switch + `TuiElementTag`, and vite
   `HOST_TAGS`; export component + types from `src/index.ts`; a `playground/src/pages/<name>.vue` page +
   a `Sidebar.vue` nav entry (routes are file-based via `vue-router/auto-routes`).
5. **Sizing (fixed-width renderables like `TabSelect`):** a native renderable given a **numeric**
   `width` ≥ its container overflows the border (its inner fills/underline bleed past). Use a
   **percentage/flex width** (`width="100%"`) — it resolves against the box _interior_ (border + padding
   aware, e.g. a `width:60` `padding:1` bordered box → `56`), so the renderable clamps to it and never
   overflows, at any terminal size. Percentages work because `Box` is real flexbox (`Select` uses `40%`).
6. **Run:** `NODE_OPTIONS='--experimental-ffi --disable-warning=ExperimentalWarning' pnpm exec vitest run src/components/<Name>.spec.ts`,
   then `pnpm test:types` + `pnpm lint`. In specs, `test.mockInput.pressArrow('left'|'right'|'up'|'down')`
   / `pressEnter()` drive keyboard nav; check the renderable's default keybindings in `index.js`
   (`defaultTabSelectKeybindings`) for which keys move it.

#### Building a component

- **Default to stateful `defineComponent`s.** Only a stateful component has a
  public instance, so consumers can grab it with `useTemplateRef` and reach
  `$el` (the backing OpenTUI renderable) and any exposed methods — a functional
  component exposes none of that. (`Input` is the template; `Textarea`/`Select`
  follow it.) Shape: `setup` + `shallowRef` for the renderable + `onMounted` to
  wire events/focus; a `name`; a runtime `props` decl (only the non-native
  props: `modelValue`, `autofocus`, …); and an `emits` object of runtime
  validators ending in `satisfies ExtractEventsNames<Props, RenderableOptions>`
  (compile-time check that every event is declared). Type the export
  `TuiComponent<Props, Renderable>` so `$el` is the concrete renderable, extend
  `RenderableEventProps` in the Props, spread `...renderableEmits`, and call
  `setupRenderableEvents(el, emit)` for the common focus/blur/destroyed. Read
  event payloads/values off `el` at emit time.
- **Reach for `FunctionalComponent<Props, Emits>` only for pure passthroughs**
  no one needs a handle to (`Text`, `Box`, `Newline`): no lifecycle, just `h()`
  — but also no instance, so no `useTemplateRef`/`$el`/exposed methods. The
  explicit `const` type satisfies `isolatedDeclarations`; add `.displayName` and
  runtime `.props` (Boolean coercion + extracts real props from `attrs`).
- **Fallthrough for native options**: spread `...attrs` so only _set_ props reach
  the renderable. **Never forward `undefined`** — it clobbers renderable defaults
  (e.g. `Input.maxLength` defaults to 1000; `undefined` drops all typed input).
- **`v-model` / outside→renderable sync rides the prop path** — pass the mapped
  prop explicitly (`value: modelValue`, `selectedIndex: modelValue`). `patchProp`
  assigns `el[key]` only when it changes (Vue skips unchanged props) and the
  OpenTUI setter is idempotent, so **no `watch` is needed**. Verify the setter is
  silent/guarded (e.g. `selectedIndex` setter doesn't emit, unlike
  `setSelectedIndex()`) or you'll loop.
- **Mount-shaped side effects** (listeners, initial `focus`): stateful
  components use `onMounted` reading the `shallowRef`; functional ones use a
  function `ref` deduped with a module `WeakSet<Renderable>` so re-invocation on
  updates doesn't double-wire.
- **Consume the event payload**, don't re-query — OpenTUI emits it
  (`selectionChanged`/`itemSelected` → `(index, option)`).
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

### @vue-termui/three (`packages/three/`)

Three.js WebGPU scenes rendered into the terminal — a Node port of
`@opentui/three` (which is Bun-only). Bun still works: the hooks no-op there
and bun-webgpu runs natively over the real `bun:ffi` (`bun dist/main.js` runs a
built app; never import `node:module`'s `registerHooks` as a named import —
Bun lacks it and fails ESM validation at load time).

- **How it runs on Node**: `bun-webgpu` (Dawn over `bun:ffi`) is loaded through
  `node:module` `registerHooks` (`src/ffi/register.ts`) that rewrite its
  `bun:ffi` imports to a `node:ffi` shim (`src/ffi/bun-ffi.ts`, needs
  `--experimental-ffi`) and resolve its platform package's `.ts` entry (which
  Node refuses to load from node_modules) to the native dylib path. Pointer
  model: Bun pointers are numbers, node:ffi's are bigints — the shim converts
  at every boundary. `setupWebGPU()` installs `navigator.gpu`, the `GPU*`
  constructors and a `requestAnimationFrame` polyfill (three's internal
  `Animation` loop needs it).
- **Ports** (keep close to upstream for diffability): `canvas.ts` (CLICanvas +
  supersampling, WGSL inlined as a TS template), `WGPURenderer.ts`
  (ThreeCliRenderer), `ThreeRenderable.ts`, `TextureUtils`/`SpriteUtils`/
  `SpriteResourceManager`/`animation/*` (sprites & particles; pure three/jimp).
  `jimp` is externalized by file URL in app builds like `bun-webgpu` — vite's
  client resolver would pick its browser build.
- **Vue layer**: `Three` component (a `tui-box` filled with a `ThreeRenderable`
  via `useRenderer()`; props `scene`/`camera`/`rendererOptions`/`autoAspect`)
  and `onFrame(cb)` (per-frame callback with effect-scope cleanup). Both import
  Vue APIs from `vue-termui` (peer dep) — never from `vue`.
- **Build/bundling invariant**: in app builds the 3D stack is **bundled** (so
  it shares the bundle's single `@vue/runtime-core` and `three`); only
  `bun-webgpu` stays external, resolved to an **absolute file URL** at build
  time by the `vue-termui:native-externals` plugin in `src/vite.ts` (a bare
  external would be unresolvable from the app under pnpm's isolated
  node_modules). Externalizing `@vue-termui/three` instead loads a second
  runtime-core and breaks provide/inject (`useRenderer() must be called…`).
- Tests need the FFI env var like the core suite; the WGPU specs create real
  GPU devices (Metal/Vulkan required). Root `vitest.config.ts` includes
  `packages/three/src`.

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

## Docs deploy (Vercel)

Docs are a workspace package (`docs/package.json`, no `engines`) because Vercel
reads the nearest `package.json` above the project Root Directory and hard-fails
on `engines.node >=26.3.0` (max supported: 24.x) before install/build commands
run. Vercel project Root Directory MUST be `docs`; build settings pinned in
`docs/vercel.json`. Keep `engines` out of `docs/package.json`.
