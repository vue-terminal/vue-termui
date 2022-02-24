import { createRenderer, App, Component } from '@vue/runtime-core'
import { onExit, Signal } from '../deps/signal-exit'
import cliCursor from 'cli-cursor'
import { createLog } from './LogUpdate'
import {
  CommentNode,
  DOMElement,
  DOMNode,
  TextNode,
  DOMElementName,
} from './dom'
import { logSymbol, rootNodeSymbol, stdoutSymbol } from './injectionSymbols'

function removeNode(node: DOMNode) {
  // recurse for children
  if (node.nodeName !== '#comment' && node.nodeName !== '#text') {
    node.childNodes.map(removeNode)
  }

  if (node.parentNode) {
    const selfIndex = node.parentNode.childNodes.indexOf(node)
    // TODO: refactor into removeChild
    if (selfIndex > -1) {
      node.parentNode.childNodes.splice(selfIndex, 1)
    }
    // remove the yoga node as well
    if (node.yogaNode) {
      node.parentNode.yogaNode?.removeChild(node.yogaNode)
    }

    // detach from parent
    node.parentNode = null
  }

  // Queue an update of dom
}

function insertNode(el: DOMNode, parent: DOMElement) {
  if (el.parentNode) {
    // TODO: is this possible?
    console.error('TODO: REMOVE ME')
  }

  parent.childNodes.push(el)

  if (parent.yogaNode && el.yogaNode) {
    parent.yogaNode.insertChild(el.yogaNode, parent.yogaNode.getChildCount())
  }
  el.parentNode = parent
}

const { render, createApp: baseCreateApp } = createRenderer<
  DOMNode,
  DOMElement
>({
  patchProp(el, key, prevValue, nextValue) {
    console.log('TODO: patchProp', { el, key, nextValue })
  },
  insert: insertNode,
  remove: removeNode,
  createElement(type) {
    // TODO: runtime check valid values
    // console.log('createElement', type)
    return new DOMElement(type as DOMElementName)
  },
  createComment(text) {
    // console.log('createComment', text)
    return new CommentNode(text)
  },
  createText(text) {
    // console.log('createText', text)
    return new TextNode(text)
  },

  parentNode(node) {
    // console.log('parentNode', node)
    return node.parentNode
  },
  nextSibling(node) {
    if (!node.parentNode) return null
    const index = node.parentNode.childNodes.indexOf(node)
    return index > -1 ? node.parentNode.childNodes[index + 1] : null
  },

  setElementText(node, text) {
    // console.log('setElementText', node, text)
    const textNode = node.childNodes.find(
      (node) => node.nodeName === '#text'
    ) as TextNode | null
    if (textNode) {
      textNode.nodeValue = text
    } else {
      insertNode(new TextNode(text), node)
    }
  },
  setText(node, text) {
    // console.log('setText', text)
    if (node.nodeName === '#text' || node.nodeName === '#comment') {
      node.nodeValue = text
    } else {
      console.error('TODO: setText', text)
      this.setElementText(node, text)
    }
  },
  cloneNode(node) {
    console.error('TODO: clone')
    return node
  },
  // setScopeId(el, id) {
  //   console.log('setScopeId', el, id)
  // },
})

type TODO = any

export interface TuiApp extends Omit<App<TODO>, 'mount'> {
  mount(): TuiApp

  waitUntilExit(): Promise<void>
}

export interface TuiAppOptions {
  /**
   * Output stream where app will be rendered.
   *
   * @default process.stdout
   */
  stdout?: NodeJS.WriteStream
  /**
   * Input stream where app will listen for input.
   *
   * @default process.stdin
   */
  stdin?: NodeJS.ReadStream
  /**
   * Error stream.
   * @default process.stderr
   */
  stderr?: NodeJS.WriteStream

  waitUntilExit?: boolean
}

export type RootProps = Record<string, unknown>

const noop = () => {}

function createApp(
  rootComponent: Component,
  {
    stdout = process.stdout,
    stdin = process.stdin,
    stderr = process.stderr,
    waitUntilExit = true,
    ...rootProps
  }: RootProps & TuiAppOptions = {}
) {
  const log = createLog(stdout)

  const app = baseCreateApp(rootComponent, rootProps)
    .provide(logSymbol, log)
    .provide(stdoutSymbol, stdout)

  // FIXME: not used but vue complains about tui-test ....
  const TUI_ELEMENT_RE = /^tui-/
  app.config.compilerOptions.isCustomElement = (tag) => {
    console.log('test ', tag)
    return true
    return TUI_ELEMENT_RE.test(tag)
  }

  const { mount, unmount } = app
  const newApp = app as unknown as TuiApp

  const onResize = () => {
    // log('Resize')
  }
  newApp.mount = () => {
    cliCursor.hide(stdout)
    log.clear()

    stdout.on('resize', onResize)
    const rootEl = new DOMElement('ink-root')
    rootEl.toString = () => `<Root>`

    newApp.provide(rootNodeSymbol, rootEl)

    mount(rootEl)
    return newApp
  }

  newApp.unmount = () => {
    stdout.off('resize', onResize)
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

  let interval: NodeJS.Timeout | undefined
  if (waitUntilExit) {
    interval = setInterval(noop, 999999)
  }

  const removeOnExitListener = onExit((code, signal) => {
    console.log({ code, signal })
    if (code !== 0 && interval) {
      clearInterval(interval)
      // TODO: depending on the signal or code
      if (signal === 'SIGINT') {
        resolveExitPromise()
      } else {
        rejectExitPromise(new TuiError(code, signal))
      }
      cliCursor.show(stdout)
      newApp.unmount()
    }
  })

  return newApp
}

export { render, createApp }

// re-export Vue core APIs
export * from '@vue/runtime-core'

export {
  useLog,
  logSymbol,
  useRootNode,
  rootNodeSymbol,
  stdoutSymbol,
  useStdout,
} from './injectionSymbols'

export class TuiError extends Error {
  code: number | null
  signal: Signal

  constructor(code: number | null, signal: Signal) {
    super(`Program Interrupted with "${signal}" ${code ? `(${code})` : ''}`)
    this.code = code
    this.signal = signal
  }
}
