import { build, resolveConfig, loadConfigFromFile, mergeConfig } from 'vite'

export async function buildCommand(entryFile: string = 'src/main.ts') {
  const found = await loadConfigFromFile({
    command: 'build',
    mode: 'production',
  })

  if (!found) {
    throw new Error('no config found')
  }

  let { config } = found
  config = mergeConfig(
    {
      build: {
        target: 'node14',
        rollupOptions: {
          input: entryFile,
        },
      },
    },
    config
  )

  await build(config)
}
