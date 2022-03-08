import { ViteNodeServer } from 'vite-node/server'
import { ViteNodeRunner } from 'vite-node/client'
import { normalizeId } from 'vite-node/utils'
import { createServer, HmrContext } from 'vite'
import { resolve } from 'path'

export async function runDevServer(entryFile: string = 'src/main.ts') {
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
        createHotContext,
        updateStyle() {},
      },
    },
  })

  interface HotCallback {
    // the dependencies must be fetchable paths
    deps: string[]
    fn: (modules: object[]) => void
  }

  interface HotModule {
    id: string
    callbacks: HotCallback[]
  }

  const hotModulesMap = new Map<string, HotModule>()
  const disposeMap = new Map<string, (data: any) => void | Promise<void>>()
  const pruneMap = new Map<string, (data: any) => void | Promise<void>>()
  const dataMap = new Map<string, any>()
  const customListenersMap = new Map<string, ((data: any) => void)[]>()
  const ctxToListenersMap = new Map<
    string,
    Map<string, ((data: any) => void)[]>
  >()

  function createHotContext(ownerPath: string) {
    const fullPath = resolve('.' + ownerPath)

    if (!dataMap.has(fullPath)) {
      dataMap.set(fullPath, {})
    }

    // when a file is hot updated, a new context is created
    // clear its stale callbacks
    const mod = hotModulesMap.get(fullPath)
    if (mod) {
      mod.callbacks = []
    }

    function acceptDeps(
      deps: string[],
      callback: HotCallback['fn'] = () => {}
    ) {
      const mod = hotModulesMap.get(fullPath) || {
        id: ownerPath,
        callbacks: [],
      }
      mod.callbacks.push({
        deps,
        fn: callback,
      })
      hotModulesMap.set(fullPath, mod)
    }

    return {
      get data() {
        return dataMap.get(fullPath)
      },
      accept(deps: any, callback?: any) {
        if (typeof deps === 'function' || !deps) {
          // self-accept: hot.accept(() => {})
          acceptDeps([ownerPath], ([mod]) => deps && deps(mod))
        } else if (typeof deps === 'string') {
          // explicit deps
          acceptDeps([deps], ([mod]) => callback && callback(mod))
        } else if (Array.isArray(deps)) {
          acceptDeps(deps, callback)
        } else {
          throw new Error(`invalid hot.accept() usage.`)
        }
      },
      prune(cb: (data: any) => void) {
        // TODO: do we need this?
        debugger
        pruneMap.set(ownerPath, cb)
      },

      invalidate(...args: any[]) {
        // TODO: is this called?
        console.error('invalidate', ...args)
      },
    }
  }

  const entryPointId = `/${entryFile}`
  const entryPoint = resolve('.' + entryPointId)

  server.watcher.on('change', async (fullPath) => {
    // console.error('changed file', fullPath)
    const existingModule = hotModulesMap.get(fullPath)

    // full reload, tell the app to stop
    if (fullPath === entryPoint) {
      // throw new InvalidateSignal()
    }

    if (existingModule) {
      const newModule = await runner.directRequest(
        existingModule.id,
        fullPath,
        []
      )
      existingModule.callbacks.forEach((cb) => cb.fn([newModule]))
    }
  })

  // provide the vite define variable in this context
  await runner.executeId('/@vite/env')
  // TODO: executeId() to get full control over the App (reload, show error)
  // should probably be added by vue-termui plugin

  async function loadApp() {
    try {
      await runner.executeId(entryPointId)
    } catch (err) {
      // TODO: full reload signal
      if (err instanceof InvalidateSignal) {
        setTimeout(loadApp, 0)
      } else {
        // TODO: make the app display an error box
        console.error(err)
      }
    }
  }

  await loadApp()
}

class InvalidateSignal extends Error {
  constructor() {
    super()
  }
}
