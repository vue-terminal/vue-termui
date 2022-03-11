// this should be used by the app
import { TuiApp } from '../app/createApp'
import { WebSocket } from 'ws'
import { TuiError } from '../errors/TuiError'

const WSS_PORT = Number(process.env.WSS_PORT) || 3000

export function setupHMRSocket(
  app: TuiApp,
  exitApp: (error?: TuiError) => void
) {
  const ws = new WebSocket(`ws://localhost:${WSS_PORT}`)

  ws.on('open', () => {
    ws.send('client connected bitch')
  })

  ws.on('message', (buf) => {
    let data: TODO | null | undefined
    try {
      data = JSON.parse(buf.toString())
    } catch (error) {
      console.error('Malformed message from server:', buf.toString())
      return
    }

    if (!data?.type || !data?.payload) {
      console.error('Ignoring message from server:', data)
      return
    }

    const { type, payload } = data

    switch (type) {
      case 'stop':
        exitApp()
        break

      default:
        console.error('Unknown message from server', type, payload)
    }
  })

  app
    .waitUntilExit()
    .catch((error) => {
      ws.send({ type: 'crash', payload: error })
    })
    .then(() => {
      ws.close()
    })

  // TODO: is this necessary?
  ws.on('error', (error) => {
    console.error('It looks like the dev server crashed... Stopping the app...')
    exitApp(TuiError.fromError(error))
  })
}

type TODO = any
