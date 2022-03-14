import type { Plugin } from 'vite'
import Vue from '@vitejs/plugin-vue'

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
  ]
}
