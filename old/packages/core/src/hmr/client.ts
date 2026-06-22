// this should be used by the app
import { TuiApp } from '../app/types'
import { WebSocket } from 'ws'
import { TuiError } from '../errors/TuiError'
import { defineMessage, parseServerMessage } from './messages'
import { WSS_PORT } from './common'

export function setupHMRSocket(
  app: TuiApp,
  exitApp: (error?: TuiError) => void
) {
  const ws = new WebSocket(`ws://localhost:${WSS_PORT}`)

  ws.on('message', (buf) => {
    const data = parseServerMessage(buf)
    if (!data) return

    const { type, payload } = data

    switch (type) {
      default:
        console.error('Unknown message from server', type, payload)
    }
  })

  app
    .waitUntilExit()
    .catch((error: Error) => {
      ws.send(defineMessage({ type: 'crash', payload: error }))
    })
    .then(() => {
      ws.close()
    })

  ws.on('close', () => {
    // the server closed the connection to likely restart the app
    exitApp()
  })

  // TODO: is this necessary?
  ws.on('error', (error) => {
    console.error('It looks like the dev server crashed... Stopping the app...')
    exitApp(TuiError.fromError(error))
  })
}
