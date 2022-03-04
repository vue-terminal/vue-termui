/// <reference types="vitest" />

import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig({
  plugins: [
    AutoImport({
      imports: ['vitest'],
    }),
  ],
  test: {
    include: ['packages/*/src/**/*.spec.ts'],
    coverage: {
      include: ['packages/*/src/**/*.ts'],
      exclude: ['packages/*/src/**/*.spec.ts', 'packages/*/src/index.ts'],
    },
  },
})
