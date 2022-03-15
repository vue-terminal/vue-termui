import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    __DEV__: `process.env.NODE_ENV !== "production"`,
  },

  build: {
    target: 'node14',
    outDir: 'dist',
    // sourcemap: isProduction ? false: 'inline',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueTermui',
      fileName: (format) => 'vue-termui.mjs',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'events',
        'assert',
        'node:events',
        'node:assert',
        '@vue/runtime-core',
        'ansi-escapes',
        'chalk',
        'cli-boxes',
        'cli-cursor',
        'cli-truncate',
        'indent-string',
        'slice-ansi',
        'string-width',
        'type-fest',
        'widest-line',
        'wrap-ansi',
        'yoga-layout',
        'yoga-layout-prebuilt',
        'ws',
      ],
    },
  },
})
