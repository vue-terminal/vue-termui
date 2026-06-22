import vue, { type Options as VuePluginOptions } from '@vitejs/plugin-vue'
import {
  createServer,
  type InlineConfig,
  isRunnableDevEnvironment,
  type Plugin,
  type ViteDevServer,
} from 'vite'

/**
 * Renderer host tags. They are neither DOM/SVG elements nor components, so the
 * SFC compiler must leave them as plain element vnodes (`createElementVNode('box', …)`)
 * instead of trying to resolve them as components.
 */
const HOST_TAGS: ReadonlySet<string> = new Set(['box', 'text'])

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
}

/**
 * Vite plugin that turns a project into a vue-termui terminal app: it runs
 * `@vitejs/plugin-vue` with the renderer host tags registered and provides the
 * build defaults for a single self-contained Node entry (bundle local sources
 * only; resolve every bare import — `vue`, `vue-termui`, the native
 * `@opentui/core`, `node:` builtins — from `node_modules` at runtime so there
 * is one shared `@vue/runtime-core` and the FFI module is never bundled).
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { defineConfig } from 'vite'
 * import vueTermui from 'vue-termui/vite'
 *
 * export default defineConfig({ plugins: [vueTermui()] })
 * ```
 *
 * @param options - {@link VueTermuiOptions}
 */
export function vueTermui(options: VueTermuiOptions = {}): Plugin[] {
  const userIsCustomElement = options.vue?.template?.compilerOptions?.isCustomElement

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

    vuePlugin,
  ]
}

/**
 * Options for {@link dev}.
 */
export interface DevServerOptions {
  /** Project root. Defaults to the current working directory. */
  root?: string
  /** App entry, resolved from the root. Defaults to `/src/main.ts`. */
  entry?: string
  /** Extra Vite config merged on top of the defaults (e.g. `configFile`). */
  inlineConfig?: InlineConfig
}

/**
 * Starts a Vite dev server and runs the terminal app in-process with HMR.
 *
 * The app executes inside Vite's runnable `ssr` environment: bare imports
 * externalize to native Node (FFI works, single `@vue/runtime-core`) and the
 * module runner rewrites imports so the code runs in this process. {@link
 * vueTermui} forces client render functions so component edits hot-update live
 * via Vue's renderer-agnostic HMR runtime. The browser WebSocket is disabled
 * (`server.ws: false`) — HMR flows through the runner's in-process channel.
 *
 * Run the launcher with `node --experimental-ffi` (creating the OpenTUI
 * renderer loads native code via FFI).
 *
 * @example
 * ```ts
 * // dev.ts — run with: node --experimental-ffi dev.ts
 * import { dev } from 'vue-termui/vite'
 * await dev()
 * ```
 *
 * @param options - {@link DevServerOptions}
 * @returns the running {@link ViteDevServer}
 */
export async function dev(options: DevServerOptions = {}): Promise<ViteDevServer> {
  const { root, entry = '/src/main.ts', inlineConfig } = options

  const server = await createServer({
    root,
    appType: 'custom',
    clearScreen: false,
    logLevel: 'error',
    server: { middlewareMode: true, ws: false },
    ...inlineConfig,
  })

  const environment = server.environments.ssr
  if (!isRunnableDevEnvironment(environment)) {
    await server.close()
    throw new Error('[vue-termui] the "ssr" environment is not runnable')
  }

  await environment.runner.import(entry)

  return server
}

export default vueTermui
