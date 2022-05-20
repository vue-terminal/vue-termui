import { defineConfig } from 'vite'
// use dev version directly
import VueTermui from '../vite-plugin-vue-termui/src'
import { resolve } from 'path'

export default defineConfig({
  define: {
    __DEV__: `process.env.NODE_ENV === "development"`,
  },

  resolve: {
    alias: {
      // Use development version instead of dist
      'vue-termui': resolve('../core/src/index.ts'),
    },
  },

  plugins: [VueTermui({ autoImportOptions: { imports: ['vitest'] } })],
})
