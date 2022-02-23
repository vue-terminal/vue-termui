import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
const VueTuiExports = [
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
]

export default defineConfig({
  mode: 'build',
  publicDir: false,
  resolve: {
    alias: {
      'vue-termui': './src/tui/renderer/index.ts',
    },
  },
  build: {
    target: 'esnext',
    minify: false,
    rollupOptions: {
      input: ['src/tui/index.ts'],
      external: [
        'events',
        'assert',
        'node:events',
        'node:assert',
        '@vue/runtime-core',
        'ansi-escapes',
        'chalk',
        'cli-boxes',
        'cli-cursor',
        'cli-truncate',
        'indent-string',
        'slice-ansi',
        'string-width',
        'type-fest',
        'widest-line',
        'wrap-ansi',
        'yoga-layout-prebuilt',
      ],

      output: {
        // file: 'dist/[name].haha.mjs',
        // dir: undefined,
        // output one file only
        manualChunks: null,
        // inlineDynamicImports: true,
        entryFileNames: '[name].mjs',
      },
    },
    watch: {
      include: ['src/tui/index.ts'],
    },
  },
  plugins: [
    AutoImport({
      imports: [
        {
          'vue-termui': VueTuiExports,
        },
      ],
    }),
    Vue(),
  ],
})
