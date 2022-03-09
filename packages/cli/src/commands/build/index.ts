import { build } from 'vite'

export async function buildCommand(entryFile: string = 'src/main.ts') {
  await build({
    build: {
      rollupOptions: {
        input: entryFile,
      },
    },
  })
}
