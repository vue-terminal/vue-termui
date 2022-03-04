import { createServer } from 'vite'
import { ViteNodeServer } from 'vite-node/server'
import { ViteNodeRunner } from 'vite-node/client'

// create vite server
const server = await createServer()
// this is need to initialize the plugins
await server.pluginContainer.buildStart({})

// create vite-node server
const node = new ViteNodeServer(server)

// create vite-node runner
const runner = new ViteNodeRunner({
  root: server.config.root,
  base: server.config.base,
  async resolveId(id, importer) {
    return node.resolveId(id, importer)
  },
  // // when having the server and runner in a different context,
  // // you will need to handle the communication between them
  // // and pass to this function
  async fetchModule(id) {
    return node.fetchModule(id)
  },
})

// execute the file
await runner.executeFile('./index.ts')

// close the vite server
await server.close()
