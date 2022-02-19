import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  mode: 'build',
  publicDir: false,
  build: {
    minify: false,
    rollupOptions: {
      input: ['src/tui/index.ts'],
      external: ['events', 'assert', 'node:events', 'node:assert'],

      output: {
        // file: 'dist/[name].haha.mjs',
        // dir: undefined,
        // output one file only
        manualChunks: null,
        // inlineDynamicImports: true,
        entryFileNames: '[name].mjs',
      },
    },
    watch: {
      include: ['src/tui/index.ts'],
    },
  },
  plugins: [vue()],
})
