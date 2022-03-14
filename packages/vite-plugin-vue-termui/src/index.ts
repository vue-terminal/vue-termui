import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import type { ImportsMap } from 'unplugin-auto-import/types'

export default function VueTermui(): Plugin[] {
  return [
    {
      name: 'vue-termui',

      config(config, env) {
        return {
          define: {
            'process.env.NODE_ENV': JSON.stringify(env.mode),
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
      template: {
        compilerOptions: {
          whitespace: 'condense',
          comments: false,
          // term ui has no native tags
          // isNativeTag: (tag) => tag.startsWith('tui-'),
          isNativeTag: () => false,
          // getTextMode: node => ???,
          isCustomElement: (tag) => tag.startsWith('tui-'),
        },
      },
    }),
    AutoImport({
      dts: true,
      imports: {
        'vue-termui': VueTuiExports,
      },
    }),
  ]
}

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
  'useStdout',
  'onKeypress',
  'onMouseEvent',
  'MouseEventType',
  'onInput',

  // components
  'TuiText',
  ['TuiText', 'Text'],
  ['TuiText', 'Span'],

  'TuiNewline',
  ['TuiNewline', 'Newline'],
  ['TuiNewline', 'Br'],

  'TuiBox',
  ['TuiBox', 'Div'],
  ['TuiBox', 'Box'],

  'TuiLink',
  ['TuiLink', 'Link'],
  ['TuiLink', 'A'],

  'TuiTextTransform',
  ['TuiTextTransform', 'TextTransform'],
]
