import vue, { type Options as VuePluginOptions } from '@vitejs/plugin-vue'
import { type NodeTransform, NodeTypes } from '@vue/compiler-dom'
import { type HotPayload, isRunnableDevEnvironment, type Plugin, type ViteDevServer } from 'vite'
import { EVENT_MODIFIER_SEPARATOR } from './components/event-modifiers'

// We use the `ssr` environment but do no SSR: it is Vite's only built-in
// environment that both runs in-process (a `ModuleRunner`, where the
// `@opentui/core` FFI lives) and externalizes bare imports to native Node. The
// `client` environment can't — it has no in-process runner. The one SSR-ism that
// leaks is plugin-vue emitting `ssrRender`, undone by `forceClientCompile` below.

/**
 * Renderer host tags. They are neither DOM/SVG elements nor components, so the
 * SFC compiler must leave them as plain element vnodes (`createElementVNode('box', …)`)
 * instead of trying to resolve them as components.
 */
const HOST_TAGS: ReadonlySet<string> = new Set(['box', 'text', 'input', 'textarea', 'select'])

/**
 * Default app entry, resolved from the project root.
 */
const DEFAULT_ENTRY = '/src/main.ts'

/**
 * Whether a `v-on` event name (as written in the template) is a terminal input
 * event whose modifiers we handle ourselves. These map to OpenTUI renderable
 * listeners — `onKeyDown`/`onKeyUp` and the `onMouse*` family — whose
 * `KeyEvent`/`MouseEvent` payloads Vue's DOM-only modifier guards cannot read.
 */
function isTuiInputEvent(name: string): boolean {
  return name.startsWith('key') || name.startsWith('mouse')
}

/**
 * SFC compiler transform that rewrites terminal input `v-on` bindings so their
 * modifiers survive to runtime. Vue's built-in `on` transform compiles
 * `@keyDown.ctrl.c` into `withKeys`/`withModifiers` wrappers that read DOM event
 * fields (`event.key`, `event.ctrlKey`) absent from OpenTUI's events — so
 * `@keyDown.enter` would simply never fire. Instead we fold the modifiers into
 * the listener prop name with {@link EVENT_MODIFIER_SEPARATOR}
 * (`@keyDown.ctrl.c` → `onKeyDown__ctrl__c`) and clear them, leaving the handler
 * unwrapped; `resolveEventListeners` — used by every renderable component —
 * parses them back out and applies them against the terminal event.
 *
 * Only static-name key/mouse bindings with modifiers are touched. Every other
 * `v-on` (other events, dynamic names, no modifiers) keeps Vue's default
 * handling, so component-emit modifiers like `.once` are unaffected.
 *
 * @internal
 */
export const encodeEventModifiers: NodeTransform = (node) => {
  if (node.type !== NodeTypes.ELEMENT) return
  for (const prop of node.props) {
    if (
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'on' &&
      prop.modifiers.length > 0 &&
      prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.isStatic &&
      isTuiInputEvent(prop.arg.content)
    ) {
      prop.arg.content = [
        prop.arg.content,
        ...prop.modifiers.map((modifier) => modifier.content),
      ].join(EVENT_MODIFIER_SEPARATOR)
      prop.modifiers = []
    }
  }
}

/**
 * Forces `@vitejs/plugin-vue` to compile **client** render functions (with HMR)
 * even when Vite runs it with the `ssr` flag on.
 *
 * The dev server executes the app in the runnable `ssr` environment so that bare
 * imports externalize to native Node (the `@opentui/core` FFI module loads for
 * real and there is a single `@vue/runtime-core`). That environment hands
 * plugin-vue `ssr: true`, which would emit `ssrRender` (HTML strings) — useless
 * for our renderer. Vite derives the runner's import rewriting from a *separate*
 * flag (`dev.moduleRunnerTransform`), so flipping plugin-vue's `ssr` to `false`
 * yields client render functions while the module runner still works.
 */
function forceClientCompile(plugin: Plugin): void {
  type Hook = (this: unknown, ...args: unknown[]) => unknown
  type HookSlot = Hook | { handler?: Hook } | undefined
  const slots = plugin as unknown as Record<'transform' | 'load', HookSlot>

  const wrap = (orig: Hook): Hook =>
    function (this: unknown, ...args: unknown[]): unknown {
      const opt = args[args.length - 1]
      if (opt && typeof opt === 'object') (opt as { ssr?: boolean }).ssr = false
      return orig.apply(this, args)
    }

  for (const name of ['transform', 'load'] as const) {
    const hook = slots[name]
    if (typeof hook === 'function') {
      slots[name] = wrap(hook)
    } else if (hook && typeof hook.handler === 'function') {
      hook.handler = wrap(hook.handler)
    }
  }
}

/**
 * Routes `@vitejs/plugin-vue`'s HMR custom events to the module runner so
 * template-only edits hot-swap the render function **without resetting state**
 * (Vue's `rerender`), exactly like a browser app — instead of a full `reload`.
 *
 * How plugin-vue's rerender-vs-reload split works on the web: on every change it
 * broadcasts a `file-changed` custom event carrying the edited file; the
 * recompiled SFC sets `__VUE_HMR_RUNTIME__.CHANGED_FILE` from it and exports
 * `_rerender_only = CHANGED_FILE === <thisFile>` (only emitted when the edit
 * touched the template alone). Its `import.meta.hot.accept` then calls
 * `rerender` (keep state) when that flag is true, else `reload` (reset state).
 *
 * plugin-vue broadcasts that event through `server.ws`, but we disable the
 * browser WebSocket (`server: { ws: false }`), so Vite makes `server.ws` a stub
 * whose `send` is a no-op. The module runner listens on the `ssr` hot channel
 * instead, so the event never arrives, `CHANGED_FILE` stays unset, and every edit
 * falls through to `reload`.
 *
 * We fix it by re-sending plugin-vue's `custom` payloads on the `ssr` hot
 * channel. Both that and the later module update go through the same channel in
 * order, so `CHANGED_FILE` is set before the recompiled module evaluates.
 *
 * Caveat: this assumes plugin-vue keeps using the legacy `handleHotUpdate` hook
 * (which sends via `server.ws`). If it moves to the env-API `hotUpdate` hook it
 * would send straight to `ssr.hot` and this bridge would be dead code. Checked
 * against `@vitejs/plugin-vue` 6.x.
 */
function bridgeHmrEventsToRunner(server: ViteDevServer): void {
  const ssr = server.environments.ssr
  if (!ssr) return

  const ws = server.ws as { send: (...args: [HotPayload] | [string, unknown?]) => void }
  const originalSend = ws.send.bind(ws)
  ws.send = (...args: [HotPayload] | [string, unknown?]): void => {
    const payload: HotPayload =
      typeof args[0] === 'string' ? { type: 'custom', event: args[0], data: args[1] } : args[0]
    if (payload.type === 'custom') ssr.hot.send(payload)
    originalSend(...args)
  }
}

/**
 * Options for the {@link vueTermui} Vite plugin.
 */
export interface VueTermuiOptions {
  /**
   * Options forwarded to `@vitejs/plugin-vue`. The `box`/`text` host tags are
   * always treated as custom elements; an `isCustomElement` provided here is
   * merged on top (it can recognise additional tags).
   */
  vue?: VuePluginOptions

  /**
   * App entry imported when the dev server starts, resolved from the project
   * root. Defaults to `/src/main.ts`.
   */
  entry?: string

  /**
   * Launch the app automatically when the Vite dev server starts, so plain
   * `vite` runs the terminal app (no launcher script). Defaults to `true`.
   */
  autoLaunch?: boolean
}

/**
 * Vite plugin that turns a project into a vue-termui terminal app.
 *
 * - Runs `@vitejs/plugin-vue` with the `box`/`text` host tags registered and
 *   forced to compile client render functions (so HMR works in the dev server's
 *   runnable `ssr` environment instead of emitting `ssrRender`).
 * - In dev (`vite`), launches the app in-process with HMR: the entry runs in the
 *   `ssr` environment (bare imports externalize to native Node — FFI works,
 *   single `@vue/runtime-core` — and the module runner rewrites imports so the
 *   code runs in this process). Vue's renderer-agnostic HMR runtime hot-updates
 *   components live. The browser WebSocket is off; HMR flows through the runner.
 *   Run with `node --experimental-ffi` (e.g. `NODE_OPTIONS=--experimental-ffi vite`).
 *
 *   HMR scope: only SFCs are hot-applied (template edits keep state, script edits
 *   reset it). Other modules (entry, router, plain `.ts`) resolve to a
 *   `full-reload`, which nothing handles yet — so those edits are not reflected
 *   live.
 * - In build (`vite build`), bundles a single self-contained Node entry: bundle
 *   local sources only and resolve every bare import from `node_modules` at
 *   runtime; the native `@opentui/core` is never bundled.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import vueTermui from 'vue-termui/vite'
 *
 * export default defineConfig({ plugins: [vueTermui()] })
 * ```
 * ```jsonc
 * // package.json
 * "scripts": {
 *   "dev": "NODE_OPTIONS=--experimental-ffi vite",
 *   "build": "vite build"
 * }
 * ```
 *
 * @param options - {@link VueTermuiOptions}
 */
export function vueTermui(options: VueTermuiOptions = {}): Plugin[] {
  const userIsCustomElement = options.vue?.template?.compilerOptions?.isCustomElement
  const userNodeTransforms = options.vue?.template?.compilerOptions?.nodeTransforms
  // The `NodeTransform` type as `@vitejs/plugin-vue` expects it, kept as the one
  // source of truth for the cast below (see `nodeTransforms`).
  type ExpectedNodeTransform = NonNullable<typeof userNodeTransforms>[number]
  const entry = options.entry ?? DEFAULT_ENTRY
  const autoLaunch = options.autoLaunch ?? true

  const vuePlugin = vue({
    ...options.vue,
    template: {
      ...options.vue?.template,
      compilerOptions: {
        ...options.vue?.template?.compilerOptions,
        isCustomElement: (tag: string) =>
          HOST_TAGS.has(tag) || (userIsCustomElement?.(tag) ?? false),
        // Encode terminal event modifiers before Vue's `on` transform runs, so
        // `@keyDown.enter` works against OpenTUI events (see `encodeEventModifiers`).
        // The cast bridges structurally identical `NodeTransform` types from
        // duplicate `@vue/compiler-{dom,core}` copies that split installs (e.g.
        // git worktrees) can produce; it is a no-op with a single install.
        nodeTransforms: [
          encodeEventModifiers as unknown as ExpectedNodeTransform,
          ...(userNodeTransforms ?? []),
        ],
      },
    },
  })
  forceClientCompile(vuePlugin)

  return [
    {
      name: 'vue-termui:config',
      config() {
        return {
          // `@opentui/core` is the native FFI renderer and ships tree-sitter
          // `.scm` query assets that esbuild/rolldown cannot parse. It must stay
          // external/native: never pre-bundle it in dev (build externalizes it
          // through `rolldownOptions.external` below).
          optimizeDeps: { exclude: ['@opentui/core'] },
          ssr: { optimizeDeps: { exclude: ['@opentui/core'] } },
          build: {
            // Node runs the output directly; no syntax down-leveling, and
            // top-level `await` in the entry must survive.
            target: 'esnext',
            // The output runs in Node/TTY, not a browser. Vite's default
            // module-preload injects a `__vitePreload` helper around every
            // dynamic import that touches browser globals (`document`,
            // `window`, `<link rel=modulepreload>`); it is meaningless here and
            // its error path would crash on those globals. Disabling it leaves
            // dynamic imports as plain `import()`.
            modulePreload: false,
            rolldownOptions: {
              input: 'src/main.ts',
              // Externalize bare imports (resolved from node_modules at runtime),
              // but keep plugin-generated virtual modules in the bundle: they
              // have no on-disk runtime equivalent. `vue-router/auto-routes`
              // (file-based routing) looks like a bare specifier but is one such
              // virtual module, so it is excluded explicitly.
              external: (id: string) =>
                id !== 'vue-router/auto-routes' &&
                !id.startsWith('\0') &&
                !id.startsWith('virtual:') &&
                !/^[./]/.test(id),
              output: { entryFileNames: '[name].js' },
            },
          },

          // TODO: find a way to forward vite errors and logs to opentui
          // clearScreen: false,
          // customLogger: console,
        }
      },
    },

    {
      name: 'vue-termui:dev',
      apply: 'serve',
      config() {
        return {
          // The terminal renderer owns the screen; keep Vite's own output from
          // fighting the alt-screen and skip the browser HMR socket (HMR flows
          // through the module runner's in-process channel instead).
          clearScreen: false,
          logLevel: 'error',
          server: { ws: false },
        }
      },
      configureServer(server) {
        bridgeHmrEventsToRunner(server)

        // Tell the in-process app (the module runner shares this process) it is
        // running under the dev server, so `createTuiApp` opens the console
        // overlay on errors — including compilation errors the runner logs via
        // `console.error`. Unset in production builds.
        ;(globalThis as { __VUE_TERMUI_DEV__?: boolean }).__VUE_TERMUI_DEV__ = true

        if (!autoLaunch) {
          return
        }
        // The first Ctrl+C destroys the OpenTUI renderer (see `createApp`), which
        // calls this teardown. Closing the dev server lets the process exit on
        // that first Ctrl+C — otherwise Vite's open handles (http server, file
        // watcher) keep it alive and a second Ctrl+C would be needed.
        ;(globalThis as { __VUE_TERMUI_TEARDOWN__?: () => void }).__VUE_TERMUI_TEARDOWN__ = () => {
          void server.close().finally(() => {
            process.exit(0)
          })
        }
        // Run after the internal middlewares are wired so the module graph is
        // ready, then drive the app from the runnable `ssr` environment.
        return () => {
          const environment = server.environments.ssr
          if (!isRunnableDevEnvironment(environment)) {
            server.config.logger.error('[vue-termui] the "ssr" environment is not runnable')
            return
          }
          void environment.runner.import(entry).catch((error: unknown) => {
            server.config.logger.error(`[vue-termui] failed to launch ${entry}`)
            console.error(error)
          })
        }
      },
    },

    vuePlugin,
  ]
}

export default vueTermui
