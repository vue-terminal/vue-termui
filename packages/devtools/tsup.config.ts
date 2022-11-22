import { defineConfig } from 'tsup'
import { dependencies } from './package.json'

export default defineConfig({
  clean: true,
  target: 'node14',
  format: ['esm', 'cjs'],
  dts: true,
  esbuildOptions(options) {
    if (options.format === 'esm') options.outExtension = { '.js': '.mjs' }
  },
  entry: ['src/index.ts'],
  external: [...Object.keys(dependencies)],
})
