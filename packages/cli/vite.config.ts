import { defineConfig } from 'vite'
import VueTermui from './src'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      'vue-termui': resolve('../termui/src/index.ts'),
    },
  },
  plugins: [VueTermui()],
})
