import { defineConfig } from 'vite'
import VueTermui from 'vite-plugin-vue-termui'
import Inspect from 'vite-plugin-inspect'
import { resolve } from 'path'

export default defineConfig({
  define: {
    __DEV__: `process.env.NODE_ENV === "development"`,
  },
  resolve: {
    alias: {
      'vue-termui': resolve('../termui/src/index.ts'),
    },
  },
  plugins: [
    VueTermui(),
    // Inspect()
  ],
})
