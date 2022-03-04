import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { VueTuiExports } from './exports'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: [
        {
          'vue-termui': VueTuiExports,
        },
      ],
    }),
    Vue({
      script: {
        templateOptions: {
          compilerOptions: {
            nodeTransforms: [
              (node, context) => {
                // context.
                // return () => { }
              },
            ],
          },
        },
      },
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
