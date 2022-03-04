import { ViteNodeServer } from 'vite-node/server'
import { ViteNodeRunner } from 'vite-node/client'
import { normalizeId } from 'vite-node/utils'
import { createServer } from 'vite'

async function run() {
  const server = await createServer({
    logLevel: 'error',
    clearScreen: false,
  })
  await server.pluginContainer.buildStart({})

  const node = new ViteNodeServer(server, {})

  const runner = new ViteNodeRunner({
    root: server.config.root,
    base: server.config.base,
    fetchModule(id) {
      return node.fetchModule(id)
    },
    resolveId(id, importer) {
      return node.resolveId(id, importer)
    },
    requestStubs: {
      '/@vite/client': {
        injectQuery: (id: string) => id,
        createHotContext() {
          return {
            accept: () => {
              // your custom logic
            },
            prune: () => {},
          }
        },
        updateStyle() {},
      },
    },
  })

  server.watcher.on('change', (i) => {
    console.error('changed file', i)
  })

  // provide the vite define variable in this context
  await runner.executeId('/@vite/env')
  await runner.executeId('/index.ts')
}

run()
