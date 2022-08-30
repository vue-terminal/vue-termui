import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  target: 'node14',
  format: ['esm', 'cjs'],
  dts: true,
  esbuildOptions(options) {
    if (options.format === 'esm')
      options.outExtension = { '.js': '.mjs' }
  },
  entry: [
    // commands because why not
    'src/index.ts',
    // cli app
    'src/cli.ts',
  ],
  external: [
    'vite-node/server',
    'vite-node/client',
    'vite-node/utils',
    'path', // huh?
  ],
})
