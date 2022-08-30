import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import * as MyModule from 'vue-termui'

type ModuleExports = keyof typeof MyModule

type AutoImportOptions = Parameters<typeof AutoImport>[0]

export interface VueTermuiOptios {
  autoImportOptions?: AutoImportOptions
}

/**
 * Typesafe alternative to Array.isArray
 * https://github.com/microsoft/TypeScript/pull/48228
 */
export const isArray: (arg: ArrayLike<any> | any) => arg is ReadonlyArray<any> =
  Array.isArray

function optionAsArray<T>(
  value: T | undefined | null
): Extract<T, readonly any[]> {
  const v = isArray(value)
    ? (value as Extract<T, readonly any[]>)
    : value != null
      ? [value as Exclude<T, readonly any[]>]
      : []

  // @ts-expect-error: just easier...
  return v
}

export default function VueTermui({
  autoImportOptions = {},
}: VueTermuiOptios = {}): Plugin[] {
  return [
    AutoImport({
      dts: true,
      ...autoImportOptions,
      include: [
        ...optionAsArray(autoImportOptions.include),
        /\.[tj]sx?$/,
        /\.vue$/,
        /\.vue\?vue/,
      ],
      imports: [
        ...optionAsArray(autoImportOptions.imports),
        { 'vue-termui': VueTuiExports },
      ],
    }),

    Components({
      dts: true,
      resolvers: [
        {
          type: 'component',
          resolve: (name) => {
            name = name.toLowerCase()
            const importName = VueTuiComponents.get(name)
            if (importName) {
              return {
                name: importName,
                // always first uppercase letter
                // TODO: use camelize / capitalize functions from utils folder in vue-termui
                as: name[0].toUpperCase() + name.slice(1),
                from: 'vue-termui',
              }
            }
          },
        },
      ],
    }),

    {
      name: 'vue-termui',

      config(config, env) {
        return {
          define: {
            'process.env.NODE_ENV': JSON.stringify(env.mode),
          },

          resolve: {
            alias: {
              '#ansi-styles': 'ansi-styles',
              '#supports-color': 'supports-color',
            },
          },

          build: {
            target: 'node14',
            rollupOptions: {
              // allows working directly with vite
              input: config.build?.rollupOptions?.input || 'src/main.ts',
              external: [
                'vue-termui',
                'events',
                'assert',
                'node:events',
                'node:assert',
                '@vue/runtime-core',
                'vue', // withKeys and other helpers are only there
                'ansi-escapes',
                'chalk',
                'picocolors',
                'cli-boxes',
                'cli-cursor',
                'cli-truncate',
                'indent-string',
                'slice-ansi',
                'string-width',
                'type-fest',
                'widest-line',
                'wrap-ansi',
                'yoga-layout',
                'yoga-layout-prebuilt',
              ],

              output: {
                // file: 'dist/[name].haha.mjs',
                // dir: undefined,
                // output one file only
                manualChunks: undefined,
                // manualChunks: () => null,
                // inlineDynamicImports: true,
                entryFileNames: '[name].mjs',
              },
            },
          },
        }
      },
    },
    Vue({
      reactivityTransform: true,
      template: {
        compilerOptions: {
          whitespace: 'condense',
          // comments: false,
          // term ui has no native tags
          isNativeTag: (tag) => tag.startsWith('tui:'),
          // isNativeTag: () => false,
          // getTextMode: node => ???,
          // isCustomElement: (tag) => tag.startsWith('tui:'),
          isVoidTag: (tag) => tag.toLowerCase() === 'hr',

          // nodeTransforms: [
          //   (node, context) => {
          //     console.log('---')
          //     console.log(node)
          //     console.log('---')
          //   },
          // ],
        },
      },
    }),
  ]
}

export const VueTuiComponents = new Map<string, ModuleExports>([
  ['br', 'TuiNewline'],
  ['newline', 'TuiNewline'],

  ['span', 'TuiText'],
  ['text', 'TuiText'],

  // FIXME: this one doesn't currently work because it has one letter
  ['a', 'TuiLink'],
  ['link', 'TuiLink'],

  ['div', 'TuiBox'],
  ['box', 'TuiBox'],

  ['transform', 'TuiTextTransform'],
  ['text-transform', 'TuiTextTransform'],
])

// copied from auto import plugin source code
declare type ImportNameAlias = [ModuleExports, string]
type ImportsMap = Record<string, (ModuleExports | ImportNameAlias)[]>

// Having this on a different file fails...
export const VueTuiExports: ImportsMap[string] = [
  // lifecycle
  'onActivated',
  'onBeforeMount',
  'onBeforeUnmount',
  'onBeforeUpdate',
  'onErrorCaptured',
  'onDeactivated',
  'onMounted',
  'onServerPrefetch',
  'onUnmounted',
  'onUpdated',

  // setup helpers
  'useAttrs',
  'useSlots',

  // reactivity,
  'computed',
  'customRef',
  'isReadonly',
  'isRef',
  'markRaw',
  'reactive',
  'readonly',
  'ref',
  'shallowReactive',
  'shallowReadonly',
  'shallowRef',
  'triggerRef',
  'toRaw',
  'toRef',
  'toRefs',
  'unref',
  'watch',
  'watchEffect',

  // component
  'defineComponent',
  'defineAsyncComponent',
  'getCurrentInstance',
  'h',
  'inject',
  'nextTick',
  'provide',
  // 'useCssModule',
  'createApp',

  // effect scope
  'effectScope',
  'EffectScope',
  'getCurrentScope',
  'onScopeDispose',

  // Vue 3 only
  'onRenderTracked',
  'onRenderTriggered',
  'resolveComponent',
  // 'useCssVars',

  // vue-termui API
  'useLog',
  'useRootNode',
  'onInputData',
  'onKeyData',
  'onMouseData',
  'MouseEventType',
  'inputDataToString',
  // TODO: only keep most used functions
  'isKeyDataEvent',
  'isMouseDataEvent',
  'isInputDataEvent',

  // composables
  'useTimeout',
  'useInterval',
]
