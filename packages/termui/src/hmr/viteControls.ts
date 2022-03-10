/**
 * This file contains controls to be used by the Vite dev server to stop, restart, listen to exit, etc.
 */

import { TuiApp } from '../app/createApp'

export interface ViteControls {
  /**
   * Listen to the application exiting without an error
   *
   * @param cb listener to add
   */
  onExit(cb: () => void): void

  // TODO:
  onError(cb: () => void): void

  // TODO:
  restart(): void

  // TODO:
  stop(): void
}

let _currentApp: TuiApp | undefined

export function registerMainApp(app: TuiApp) {
  _currentApp = app
}

export function getCurrentApp(): TuiApp | undefined {
  return _currentApp
}

export const onExit: ViteControls['onExit'] = (cb) => {
  const app = getCurrentApp()

  if (!app) {
    throw new Error('No Current App')
  }

  app.waitUntilExit().then(cb)
}

/**
 * TODO: this doesn't work, we probably need some socket connection between the running app and the server.
 */
