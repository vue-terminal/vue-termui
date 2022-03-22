import type { Component } from '@vue/runtime-core'
import { markRaw } from '@vue/runtime-core'
import cliCursor from 'cli-cursor'
import { TuiError } from '../errors/TuiError'
import { TuiApp as TuiRoot } from '../components'
import { attachInputHandler } from '../input/handling'
import { onExit } from '../deps/signal-exit'
import { DOMElement } from '../renderer/dom'
import {
  logSymbol,
  rootNodeSymbol,
  renderOnceSymbol,
} from '../injectionSymbols'
import { createLog } from '../renderer/LogUpdate'
import { baseCreateApp } from '../renderer'
import { RootProps, TuiApp, TuiAppOptions } from './types'
import {
  isRawModeSupported,
  RESTORE_SCREEN_BUFFER,
  SAVE_SCREEN_BUFFER,
} from '../input/inputSequences'
import { createFocusManager, FocusManagerSymbol } from '../focus/FocusManager'

const noop = () => {}

export function createApp(
  rootComponent: Component,
  {
    // TODO: move this options to mount
    stdout = process.stdout,
    stdin = process.stdin,
    stderr = process.stderr,
    swapScreens,
    ...rootProps
  }: RootProps & TuiAppOptions = {}
) {
  const log = createLog(stdout)

  const app = baseCreateApp(TuiRoot, {
    root: markRaw(rootComponent),
    stdout: markRaw(stdout),
    ...rootProps,
  }).provide(logSymbol, log)

  const { mount, unmount } = app
  const newApp = app as unknown as TuiApp

  // P s = 9 → Send Mouse X & Y on button press. See the section Mouse Tracking.
  // const MOUSE_MODE = '1002'
  // const ACTIVATE_MOUSE = '\x1b[?9h'
  // const DEACTIVATE_MOUSE = '\x1b[?9l'
  // const ACTIVATE_MOUSE = `\x1b[?${MOUSE_MODE}h`
  // const DEACTIVATE_MOUSE = `\x1b[?${MOUSE_MODE}l`
  // 1000 Normal mouse tracking, sends X and Y on butt press and release
  // 1002 Reports mouse move
  // 1003 Reports all events: useful if needed to track mouse at all times
  // 1005 Enables utf-8 support for encoding Cx and Cy >223
  // 1015 RXVT mouse mode: Allows mouse coordinates of >223
  // 1006 SGR mouse mode: Allows mouse coordinates of >223, preferred over RXVT mode -> ESC[<button;x;y;M
  // https://invisible-island.net/xterm/ctlseqs/ctlseqs.html#h3-Extended-coordinates
  const ACTIVATE_MOUSE = `\x1b[?1000h\x1b[?1002h\x1b[?1005\x1b[?1006h`
  const DEACTIVATE_MOUSE = `\x1b[?1006l\x1b[?1005\x1b[?1002l\x1b[?1000l`
  // const ACTIVATE_MOUSE = `\x1b[?1000h\x1b[?1002h\x1b[?1015h\x1b[?1006h`
  // const DEACTIVATE_MOUSE = `\x1b[?1006l\x1b[?1015l\x1b[?1002l\x1b[?1000l`
  let detachKeyboardHandler: undefined | (() => void)
  newApp.mount = ({ renderOnce = false, exitOnCtrlC = true } = {}) => {
    cliCursor.hide(stdout)
    if (swapScreens) {
      stdout.write(SAVE_SCREEN_BUFFER)
      stdout.cursorTo(0, 0)
    }
    log.clear()

    const rootEl = new DOMElement('tui:root')
    // for debugging purposes
    rootEl.toString = () => `<Root>`

    const focusManager = createFocusManager(rootEl)

    newApp.provide(rootNodeSymbol, rootEl)
    newApp.provide(renderOnceSymbol, renderOnce)
    newApp.provide(FocusManagerSymbol, focusManager)

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
          stdout.write(ACTIVATE_MOUSE)
        }
      } else if (--rawModeEnableCount === 0) {
        // TODO: should we write these codes to stdin or stdout?
        stdout.write(DEACTIVATE_MOUSE)
        stdin.setRawMode(false)
        stdin.removeListener('data', appOnData)
        stdin.pause()
      }
    }
    // TODO: move these and appOnData somewhere else
    const TAB = '\t'
    const SHIFT_TAB = '\x1b[Z'
    const ESC = '\x1b'
    const CTRL_C = '\x03'
    function appOnData(input: string) {
      // Exit on Ctrl+C
      // eslint-disable-next-line unicorn/no-hex-escape
      if (input === CTRL_C && exitOnCtrlC) {
        stopApp()
        // setTimeout(stopApp, 1000)
      } else if (input === ESC) {
        focusManager.focus(null)
      } else if (input === TAB) {
        focusManager.focusNext()
      } else if (input === SHIFT_TAB) {
        focusManager.focusPrevious()
      }
    }

    if (!renderOnce) {
      detachKeyboardHandler = attachInputHandler(app, stdin, { setRawMode })
    }

    mount(rootEl)
    return newApp
  }

  newApp.unmount = () => {
    cliCursor.show(stdout)
    if (swapScreens) {
      stdout.write(RESTORE_SCREEN_BUFFER)
    }
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

  function stopApp(error?: TuiError) {
    newApp.unmount()
    if (error) {
      rejectExitPromise(error)
    } else {
      resolveExitPromise()
    }
  }
  _currentExitApp = stopApp

  const removeOnExitListener = onExit((code, signal) => {
    // console.log({ code, signal })
    if (code !== 0) {
      // TODO: depending on the signal or code
      stopApp(signal !== 'SIGINT' ? undefined : new TuiError(code, signal))
    }
  })

  // the variable is injected via the vite plugin so this part of the code is always skipped
  // TODO: check if it works when no ws is installed, if not maybe move to dynamic import
  if (__DEV__) {
    import('../hmr').then(({ setupHMRSocket }) => {
      setupHMRSocket(newApp, stopApp)
    })
  }

  return newApp
}

let _currentExitApp: (() => void) | undefined

export function exitApp() {
  _currentExitApp?.()
}
