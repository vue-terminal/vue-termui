/// <reference types="vitest" />
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
    //
    VueTermui({
      autoImportOptions: {
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
        imports: ['vitest'],
        dts: true,
      },
    }),
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
