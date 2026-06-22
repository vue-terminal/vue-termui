import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  mode: 'build',
  publicDir: false,
  resolve: {
    alias: {
      // 'vue-termui': '../core/src/index.ts',
      '#ansi-styles': 'ansi-styles',
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
          // getTextMode: node => ???,
          isCustomElement: (tag) => tag.startsWith('tui:'),
        },
      },
    }),
  ],
})
