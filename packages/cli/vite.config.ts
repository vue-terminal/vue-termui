import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Vue from '@vitejs/plugin-vue'
import VueTermui from './src'

export default defineConfig({
  resolve: {
    alias: {
      // 'vue-termui': '../termui/src/index.ts',
    },
  },
  plugins: [
    // AutoImport({
    //   imports: [
    //     {
    //       // 'vue-termui': VueTuiExports,
    //     },
    //   ],
    // }),
    VueTermui(),
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
  ],
})
