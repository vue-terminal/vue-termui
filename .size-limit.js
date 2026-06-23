// Measure vue-termui's own footprint. `@opentui/core` is a heavy native
// terminal renderer that ships `with { type: 'file' }` asset imports esbuild
// can't bundle, so it's treated as external like `vue`. `platform: 'node'`
// keeps Node builtins (events, node:fs/promises, …) external too.
const nodePlatform = (config) => {
  config.platform = 'node'
  return config
}

const ignore = ['vue', '@opentui/core']

export default [
  {
    name: 'everything from source',
    path: 'src/index.ts',
    import: '*',
    ignore,
    modifyEsbuildConfig: nodePlatform,
  },
  {
    name: 'everything from dist',
    path: 'dist/index.mjs',
    import: '*',
    ignore,
    modifyEsbuildConfig: nodePlatform,
  },
]
