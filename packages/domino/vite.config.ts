/// <reference types="vitest" />
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
// use dev version directly
import VueTermui from '../vite-plugin-vue-termui/src'
import { resolve } from 'path'

export default defineConfig({
  define: {
    __DEV__: JSON.stringify(!(process.env.NODE_ENV === 'production')),
  },

  resolve: {
    alias: {
      // Use development version instead of dist
      'vue-termui': resolve('../core/src/index.ts'),
    },
  },

  plugins: [
    AutoImport({ imports: ['vitest'], dts: true }),
    //
    VueTermui(),
  ],

  test: {
    include: ['src/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/index.ts', 'src/mocks'],
    },
  },
})
