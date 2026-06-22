import vue, { type Options as VuePluginOptions } from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'

/**
 * Renderer host tags. They are neither DOM/SVG elements nor components, so the
 * SFC compiler must leave them as plain element vnodes (`createElementVNode('box', …)`)
 * instead of trying to resolve them as components.
 */
const HOST_TAGS: ReadonlySet<string> = new Set(['box', 'text'])

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

  return [
    {
      name: 'vue-termui:build',
      config() {
        return {
          build: {
            // Node runs the output directly; no syntax down-leveling, and
            // top-level `await` in the entry must survive.
            target: 'esnext',
            rollupOptions: {
              input: 'src/main.ts',
              external: (id: string) => !/^[./]/.test(id),
              output: { entryFileNames: '[name].js' },
            },
          },
        }
      },
    },

    vue({
      ...options.vue,
      template: {
        ...options.vue?.template,
        compilerOptions: {
          ...options.vue?.template?.compilerOptions,
          isCustomElement: (tag: string) =>
            HOST_TAGS.has(tag) || (userIsCustomElement?.(tag) ?? false),
        },
      },
    }),
  ]
}

export default vueTermui
