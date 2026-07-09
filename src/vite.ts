import { builtinModules } from 'node:module'
import { pathToFileURL } from 'node:url'
import vue, { type Options as VuePluginOptions } from '@vitejs/plugin-vue'
import { type HotPayload, isRunnableDevEnvironment, type Plugin, type ViteDevServer } from 'vite'

// We use the `ssr` environment but do no SSR: it is Vite's only built-in
// environment that both runs in-process (a `ModuleRunner`, where the
// `@opentui/core` FFI lives) and externalizes bare imports to native Node. The
// `client` environment can't — it has no in-process runner. The one SSR-ism that
// leaks is plugin-vue emitting `ssrRender`, undone by `forceClientCompile` below.

/**
 * Reserved namespace for renderer host tags (`tui-box`, `tui-text`, …). They are
 * neither DOM/SVG elements nor components, so the SFC compiler must leave them as
 * plain element vnodes (`createElementVNode('tui-box', …)`) instead of trying to
 * resolve them as components. Matching by prefix (rather than an explicit set)
 * reserves the whole `tui-` namespace for the renderer and keeps generic names
 * like `box`/`text`/`select` free for user components.
 */
const TUI_TAG_PREFIX = 'tui-'

/**
 * Default app entry, resolved from the project root.
 */
const DEFAULT_ENTRY = '/src/main.ts'

/**
 * Bare (unprefixed) Node builtin specifiers, e.g. `fs`, `fs/promises`.
 * `node:`-prefixed ids are matched by prefix instead — prefix-only builtins
 * (like `node:test`) are not listed in `builtinModules`.
 */
const NODE_BUILTINS: ReadonlySet<string> = new Set(builtinModules)

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
   * Options forwarded to `@vitejs/plugin-vue`. The `tui-` host tags
   * (`tui-box`, `tui-text`, …) are always treated as custom elements; an
   * `isCustomElement` provided here is merged on top (it can recognise
   * additional tags).
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
 * - Runs `@vitejs/plugin-vue` with the `tui-` host tags registered and
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
 * - In build (`vite build`), bundles a single self-contained Node entry: every
 *   dep is inlined except Node builtins and the native `@opentui/core`, which
 *   resolve from `node_modules` at runtime.
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
  const entry = options.entry ?? DEFAULT_ENTRY
  const autoLaunch = options.autoLaunch ?? true

  const vuePlugin = vue({
    ...options.vue,
    template: {
      ...options.vue?.template,
      compilerOptions: {
        ...options.vue?.template?.compilerOptions,
        isCustomElement: (tag: string) =>
          tag.startsWith(TUI_TAG_PREFIX) || (userIsCustomElement?.(tag) ?? false),
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
          // through `rolldownOptions.external` below). `bun-webgpu` (used by
          // `@vue-termui/three`) is native FFI too.
          optimizeDeps: { exclude: ['@opentui/core', 'bun-webgpu'] },
          ssr: { optimizeDeps: { exclude: ['@opentui/core', 'bun-webgpu'] } },
          // No server root in a terminal app: a relative base makes built
          // asset URLs resolve next to the bundle instead of `file:///assets`.
          base: './',
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
            // Native APIs (e.g. `@opentui/core` audio) need real file paths,
            // not `data:` URIs — never inline assets.
            assetsInlineLimit: 0,
            rolldownOptions: {
              input: 'src/main.ts',
              // Inline every dep so the output is a self-contained entry (and
              // so the bundler replaces `process.env.NODE_ENV` everywhere,
              // dead-code-eliminating dev-only guards — e.g. vue-termui's
              // nested-`<Text>` warning — in a production build). Inlining is
              // also what keeps the runtime single-instance: everything that
              // touches `@vue/runtime-core` (`vue-termui`, `@vue-termui/three`,
              // `vue-router`, …) dedupes inside the one bundle, where a mixed
              // bundled/external graph would load a second runtime-core and
              // break vnode/provide-inject interop. Only what cannot be bundled
              // stays external, resolved from node_modules at runtime: Node
              // builtins and `@opentui/core`, the native FFI renderer, which
              // ships tree-sitter `.scm` query assets that esbuild/rolldown
              // cannot parse. (`bun-webgpu` is handled by the
              // `vue-termui:native-externals` plugin below.)
              external: (id: string) =>
                id === '@opentui/core' ||
                id.startsWith('@opentui/core/') ||
                id.startsWith('node:') ||
                NODE_BUILTINS.has(id),
              output: {
                entryFileNames: '[name].js',
                // Make the entry directly executable so `"bin": "dist/main.js"`
                // works out of the box: the FFI flag lives in the shebang.
                // `env -S` splits the line into words — a plain `#!/usr/bin/env
                // node --experimental-ffi` fails on Linux, which passes
                // everything after `env` as one argument. Node treats a leading
                // `#!` line as a comment, so it is inert under plain
                // `node dist/main.js` too.
                banner:
                  '#!/usr/bin/env -S node --experimental-ffi --disable-warning=ExperimentalWarning',
              },
            },
          },
        }
      },
    },

    {
      // `bun-webgpu` (the WebGPU FFI used by `@vue-termui/three`) cannot be
      // bundled: it dlopens a native Dawn library resolved relative to its own
      // package. A bare external would break too — under pnpm's isolated
      // node_modules it is only resolvable from `@vue-termui/three`, not from
      // the app's `dist/`. Resolve it at build time and emit the absolute file
      // URL as the external id, so the bundle imports the real module directly.
      // Build-only: in dev the module runner already imports it natively.
      name: 'vue-termui:native-externals',
      apply: 'build',
      enforce: 'pre',
      async resolveId(id, importer, options) {
        if (id !== 'bun-webgpu') return
        const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
        if (!resolved) return
        return { id: pathToFileURL(resolved.id).href, external: true }
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
        let closing = false
        // The first Ctrl+C destroys the OpenTUI renderer (see `createApp`), which
        // calls this teardown. Closing the dev server lets the process exit on
        // that first Ctrl+C — otherwise Vite's open handles (http server, file
        // watcher) keep it alive and a second Ctrl+C would be needed.
        ;(globalThis as { __VUE_TERMUI_TEARDOWN__?: () => void }).__VUE_TERMUI_TEARDOWN__ = () => {
          closing = true
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
            // Teardown closes the server, which rejects this pending import
            // ("transport was disconnected") — shutdown noise, not a failure.
            if (closing) return
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
