import { Component } from '@vue/runtime-core'
import cliCursor from 'cli-cursor'
import { TuiError } from '../errors/TuiError'
import { TuiText, TuiNewline, TuiBox, TuiApp as TuiRoot } from '../components'
import { attachKeyboardHandler } from '../composables/keyboard'
import { onExit } from '../deps/signal-exit'
import { DOMElement } from '../dom'
import {
  logSymbol,
  stdoutSymbol,
  rootNodeSymbol,
  renderOnceSymbol,
} from '../injectionSymbols'
import { createLog } from '../LogUpdate'
import { baseCreateApp } from '../renderer'
import { setupHMRSocket } from '../hmr'
import { RootProps, TuiApp, TuiAppOptions } from './types'
import { isRawModeSupported } from '../input/inputSequences'

const noop = () => {}

export function createApp(
  rootComponent: Component,
  {
    // TODO: move this options to mount
    stdout = process.stdout,
    stdin = process.stdin,
    stderr = process.stderr,
    ...rootProps
  }: RootProps & TuiAppOptions = {}
) {
  const log = createLog(stdout)

  const app = baseCreateApp(TuiRoot, {
    root: rootComponent,
    ...rootProps,
  })
    .provide(logSymbol, log)
    .provide(stdoutSymbol, stdout)

  // FIXME: do we need this?
  app.config.compilerOptions.isCustomElement = (tag) =>
    tag.startsWith('Tui') || tag.startsWith('tui-')

  const { mount, unmount } = app
  const newApp = app as unknown as TuiApp

  // TODO: use auto import to enable treeshaking
  newApp.component('TuiText', TuiText)
  newApp.component('Text', TuiText)
  newApp.component('Span', TuiText)
  // newApp.component('span', TuiText)

  newApp.component('TuiNewline', TuiNewline)
  newApp.component('Newline', TuiNewline)
  newApp.component('Br', TuiNewline)
  // newApp.component('br', TuiNewline)

  newApp.component('TuiBox', TuiBox)
  newApp.component('Box', TuiBox)
  newApp.component('Div', TuiBox)
  // newApp.component('div', TuiBox)

  const onResize = () => {
    // log('Resize')
  }

  let detachKeyboardHandler: undefined | (() => void)
  newApp.mount = ({ renderOnce = false, exitOnCtrlC = true } = {}) => {
    cliCursor.hide(stdout)
    log.clear()

    stdout.on('resize', onResize)
    const rootEl = new DOMElement('tui-root')
    rootEl.toString = () => `<Root>`

    newApp.provide(rootNodeSymbol, rootEl)
    newApp.provide(renderOnceSymbol, renderOnce)

    // TODO: is raw mode supported?
    let rawModeEnableCount = 0
    function setRawMode(isEnabled: boolean) {
      if (!isRawModeSupported(stdin)) {
        if (stdin === process.stdin) {
          // TODO: adapt links
          throw new Error(
            'Raw mode is not supported on the current process.stdin, which Vue TermUI uses as an input stream by default.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported'
          )
        } else {
          throw new Error(
            'Raw mode is not supported on the stdin provided to Vue TermUI.\nRead about how to prevent this error on https://github.com/vadimdemedes/ink/#israwmodesupported'
          )
        }
      }

      stdin.setEncoding('utf8')

      if (isEnabled) {
        if (++rawModeEnableCount === 1) {
          stdin.addListener('data', appOnData)
          stdin.resume()
          stdin.setRawMode(true)
        }
      } else if (--rawModeEnableCount === 0) {
        stdin.setRawMode(false)
        stdin.removeListener('data', appOnData)
        stdin.pause()
      }
    }
    // TODO: move these and appOnData somewhere else
    const TAB = '\t'
    const SHIFT_TAB = '\u001B[Z'
    const ESC = '\u001B'
    const CTRL_C = '\x03'
    function appOnData(input: string) {
      // Exit on Ctrl+C
      // eslint-disable-next-line unicorn/no-hex-escape
      if (input === CTRL_C && exitOnCtrlC) {
        return exitApp()
      }

      // Reset focus when there's an active focused component on Esc
      // if (input === ESC && this.state.activeFocusId) {
      //   this.setState({
      //     activeFocusId: undefined,
      //   })
      // }

      // if (this.state.isFocusEnabled && this.state.focusables.length > 0) {
      //   if (input === TAB) {
      //     this.focusNext()
      //   }

      //   if (input === SHIFT_TAB) {
      //     this.focusPrevious()
      //   }
      // }
    }
    detachKeyboardHandler = attachKeyboardHandler(app, stdin, { setRawMode })

    mount(rootEl)
    return newApp
  }

  newApp.unmount = () => {
    stdout.off('resize', onResize)
    // also calls setRawMode(false)
    detachKeyboardHandler?.()
    removeOnExitListener()

    // if not debug
    log.done()
    unmount()
  }

  let exitPromise: Promise<void> | undefined
  let resolveExitPromise: () => void = noop
  let rejectExitPromise: (reason?: Error) => void = noop
  newApp.waitUntilExit = () => {
    if (!exitPromise) {
      exitPromise = new Promise((resolve, reject) => {
        resolveExitPromise = resolve
        rejectExitPromise = reject
      })
    }
    return exitPromise
  }

  function exitApp(error?: TuiError) {
    if (error) {
      rejectExitPromise(error)
    } else {
      resolveExitPromise()
    }
    cliCursor.show(stdout)
    newApp.unmount()
  }
  _currentExitApp = exitApp

  const removeOnExitListener = onExit((code, signal) => {
    console.log({ code, signal })
    if (code !== 0) {
      // TODO: depending on the signal or code
      exitApp(signal !== 'SIGINT' ? undefined : new TuiError(code, signal))
    }
  })

  // the variable is injected via the vite plugin so this part of the code is always skipped
  // TODO: check if it works when no ws is installed, if not maybe move to dynamic import
  if (process.env.NODE_ENV !== 'production') {
    setupHMRSocket(newApp, exitApp)
  }

  return newApp
}

let _currentExitApp: (() => void) | undefined

export function exitApp() {
  _currentExitApp?.()
}
