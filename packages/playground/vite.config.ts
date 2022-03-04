import { defineConfig, mergeConfig } from 'vite'
import { config } from 'vue-termui'

export default mergeConfig(
  config,
  defineConfig({
    mode: 'build',
    publicDir: false,
    resolve: {
      alias: {
        'vue-termui': '../termui/src/index.ts',
      },
    },
    build: {
      target: 'esnext',
      sourcemap: true,
      minify: false,
      rollupOptions: {
        input: ['src/main.ts'],
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
  })
)
