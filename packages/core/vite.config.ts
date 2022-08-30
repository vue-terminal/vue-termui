/// <reference types="vitest" />
import { resolve } from 'path'
import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  define: {
    __DEV__: `process.env.NODE_ENV === "development"`,
  },

  resolve: {
    alias: {
      '~/': resolve(__dirname, './src'),
    },
  },

  plugins: [Vue(), AutoImport({ imports: ['vitest'], dts: true })],

  build: {
    target: 'node14',
    outDir: 'dist',
    // sourcemap: isProduction ? false: 'inline',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueTermui',
      fileName: (format) => 'vue-termui.mjs',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'events',
        'assert',
        'node:events',
        'node:assert',
        'node:fs',
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
        'ws',
      ],
    },
  },

  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts', 'src/mocks'],
    },
  },
})
