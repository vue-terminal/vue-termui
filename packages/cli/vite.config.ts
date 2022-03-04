import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import VueTermui from './src'

export default defineConfig({
  resolve: {
    alias: {
      'vue-termui': '../termui/src/index.ts',
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
    VueTermui(),
  ],
})
