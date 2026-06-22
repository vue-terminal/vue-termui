import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext',
    rollupOptions: {
      input: 'src/main.ts',
      // Bundle only local sources; resolve every bare import (vue, vue-termui,
      // the native @opentui/core, node: builtins) from node_modules at runtime.
      external: (id) => !/^[./]/.test(id),
      output: { entryFileNames: '[name].js' },
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // box/text are renderer host tags, not DOM elements or components.
          isCustomElement: (tag) => tag === 'box' || tag === 'text',
        },
      },
    }),
  ],
})
