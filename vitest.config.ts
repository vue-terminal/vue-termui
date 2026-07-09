import { defineConfig } from 'vitest/config'
import Vue from '@vitejs/plugin-vue'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcovonly', 'html'],
      include: ['src', 'packages/three/src'],
      exclude: ['**/src/index.ts', '**/*.test-d.ts', '**/__tests__/**'],
    },

    projects: [
      {
        plugins: [Vue()],
        test: {
          name: 'core',
          include: ['src/**/*.{test,spec}.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
          },
        },
      },
      {
        test: {
          name: 'three',
          include: ['packages/three/src/**/*.{test,spec}.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
          },
        },
      },
    ],
  },
})
