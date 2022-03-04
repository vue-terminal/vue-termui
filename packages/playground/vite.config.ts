import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  mode: 'build',
  publicDir: false,
  resolve: {
    alias: {
      // 'vue-termui': '../termui/src/index.ts',
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    minify: false,
    rollupOptions: {
      input: ['src/main.ts'],
      // to make the bundling faster
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
        'yoga-layout',
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
      include: ['src/main.ts'],
    },
  },

  plugins: [
    AutoImport({
      imports: [
        {
          // 'vue-termui': VueTuiExports,
        },
      ],
    }),
    Vue({
      template: {
        compilerOptions: {
          whitespace: 'condense',
          comments: false,
          isNativeTag: () => false,
          // getTextMode: node => ???,
          isCustomElement: (tag) => tag.startsWith('tui-'),
        },
      },
    }),
  ],
})
