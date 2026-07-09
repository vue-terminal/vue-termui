import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',
  sourcemap: true,
  dts: {
    enabled: true,
    oxc: true,
  },
  // sets package.json "exports" field to the generated files
  exports: true,
  clean: true,
})
