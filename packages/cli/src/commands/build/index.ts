import { build } from 'vite'

export async function buildCommand(entryFile: string = 'src/main.ts') {
  await build({
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
      rollupOptions: {
        input: entryFile,
      },
    },
  })
}
