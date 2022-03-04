import { createServer } from 'vite'
import { ViteNodeServer } from 'vite-node/server'
import { ViteNodeRunner } from 'vite-node/client'

async function main() {
  // create vite server
  const server = await createServer()
  // this is need to initialize the plugins
  await server.pluginContainer.buildStart({})
  server.printUrls()

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

  // import('http:localhost:3000/demo/App.vue').then(console.log)
  console.log(await runner.directRequest('./index.ts', './index.ts', []))

  // execute the file
  // await runner.executeFile('./index.ts')

  // close the vite server
  await server.close()
}

main()
