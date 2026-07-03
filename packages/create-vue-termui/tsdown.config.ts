import { defineConfig } from 'tsdown'

// The CLI ships as a single ESM bin. It only uses Node builtins, so there's
// nothing to bundle and no types to emit — tsdown just strips TS and preserves
// the shebang from the entry file.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'esnext',
  dts: false,
  clean: true,
})
