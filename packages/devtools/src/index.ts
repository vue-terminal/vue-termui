import devtools from '@vue/devtools'
import express from 'express'
// @ts-ignore
import launchMiddleware from 'launch-editor-middleware'

export interface DevtoolsOptions {
  title?: string
  host?: string
  openInEditor?: boolean
}

const SERVER_PORT = 8098

export function createDevtools(options: DevtoolsOptions = {}) {
  const {
    host = 'http://localhost',
    openInEditor = true,
    title = 'vue-termui devtools',
  } = options

  // workaround for @vue/devtools
  global.document = {
    title,
    createElement: () => ({}),
    querySelector: () => ({}),
    querySelectorAll: () => [],
  }

  if (openInEditor) {
    global.VUE_DEVTOOLS_CONFIG = {
      openInEditorHost: `${host}:${SERVER_PORT}/`,
    }
    const app = express()
    app.use('/__open-in-editor', launchMiddleware())
    app.listen(SERVER_PORT)
  }

  return {
    devtools,
    connect() {
      devtools.connect(host, SERVER_PORT)
    },
  }
}
