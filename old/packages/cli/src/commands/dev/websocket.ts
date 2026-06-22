import { ViteDevServer } from 'vite'
import { WebSocketServer } from 'ws'

export async function startHMRServer(
  server: ViteDevServer,
  port: number | undefined | null
) {
  let pendingWSS: WebSocketServer | null = null
  // if a port is required, avoid trying other ports
  const isStrictPort = port != null
  port = port || 3000

  while (!pendingWSS) {
    pendingWSS = await createHMRWSS(port++, isStrictPort)
  }

  const wss = pendingWSS

  wss.on('connection', (ws) => {
    ws.on('message', (buf) => {
      const data = buf.toString()
      console.error('Received', data)
    })

    ws.on('error', (error) => {
      console.error('they error', error)
      // TODO: crash, restart, panel of options?
    })

    ws.on('close', (status, buf) => {
      if (isConnectionClosedNormally(status)) {
        wss.close()
        server.close()
      } else {
        // TODO: restart or crash
        console.error('Unexpectedly closed from client:')
        console.error('status:', status)
        console.error('data:', buf.toString())
      }
    })
  })

  return { wss, port: port - 1 }
}

function createHMRWSS(port: number, strictPort: boolean) {
  return new Promise<WebSocketServer | null>((resolve, reject) => {
    // create the socket server to communicate between the running process and the dev server
    const wss = new WebSocketServer({ port })

    function onError(error: Error & { code?: string }) {
      wss.off('error', onError)
      if (error.code === 'EADDRINUSE') {
        if (strictPort) {
          reject(new Error(`Port ${port} is already in use`))
        } else {
          console.info(`Port ${port} is in use, trying another one...`)
          resolve(null)
        }
        wss.close()
      } else {
        wss.close()
        reject(error)
      }
    }
    wss.on('error', onError)

    function onListening() {
      console.log(`Started dev Server on port ${port}`)
      wss.off('listening', onListening)
      resolve(wss)
    }
    wss.on('listening', onListening)
  })
}

/**
 * WebSocket connection codes from https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
 */
export enum CloseEventCode {
  normal = 1000,
  goingAway = 1001,
  protocolError = 1002,
  unsupported = 1003,
  // classic ctrl-c
  noStatus = 1005,
  abnormal = 1005,
  tooLarge = 1009,
  internal = 1011,
  restart = 1012,

  // 3000-3999 for libraries, frameworks, NOT applications
  // 4000-4999 for applications
}

function isConnectionClosedNormally(status: number) {
  return status === CloseEventCode.noStatus || status === CloseEventCode.normal
}
