import vue, { type Options as VuePluginOptions } from '@vitejs/plugin-vue'
import { isRunnableDevEnvironment, type Plugin } from 'vite'

/**
 * Renderer host tags. They are neither DOM/SVG elements nor components, so the
 * SFC compiler must leave them as plain element vnodes (`createElementVNode('box', …)`)
 * instead of trying to resolve them as components.
 */
const HOST_TAGS: ReadonlySet<string> = new Set(['box', 'text'])

/** Default app entry, resolved from the project root. */
const DEFAULT_ENTRY = '/src/main.ts'

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
        if (!autoLaunch) return
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
