import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [Vue()],

  test: {
    include: ['{src,packages/three/src}/**/*.{test,spec}.ts'],
    environment: 'happy-dom',
    typecheck: {
      enabled: true,
    },
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcovonly', 'html'],
      include: ['src', 'packages/three/src'],
      exclude: ['**/src/index.ts', '**/*.test-d.ts', '**/__tests__/**'],
    },
  },
})
