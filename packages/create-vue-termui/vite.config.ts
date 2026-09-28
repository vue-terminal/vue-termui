import { defineConfig } from 'vite-plus'

// The CLI ships as a single ESM bin. It only uses Node builtins, so there's
// nothing to bundle and no types to emit — tsdown just strips TS and preserves
// the shebang from the entry file.
export default defineConfig({
  pack: {
    deps: {
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'esnext',
    dts: false,
    clean: true,
  },
})
