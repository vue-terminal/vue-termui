import { createRenderer, App, Component } from '@vue/runtime-core'
import { onExit, Signal } from './deps/signal-exit'
import cliCursor from 'cli-cursor'
import { createLog } from './LogUpdate'
import {
  CommentNode,
  DOMElement,
  DOMNode,
  TextNode,
  DOMElementName,
} from './dom'
import {
  logSymbol,
  rootNodeSymbol,
  stdoutSymbol,
  renderOnceSymbol,
} from './injectionSymbols'
import { TuiText, TuiNewline, TuiApp as RootApp, TuiBox } from './components'
import { applyStyles } from './styles'

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
      node.yogaNode.unsetMeasureFunc()
      node.yogaNode.freeRecursive()
    }

    // detach from parent
    node.parentNode = null
  }

  // Queue an update of dom
}

const { render, createApp: baseCreateApp } = createRenderer<
  DOMNode,
  DOMElement
>({
  patchProp(el, key: keyof DOMElement, prevValue, nextValue) {
    // console.log('TODO: patchProp', { el, key, nextValue })
    if (key === 'style') {
      el.style = nextValue
      if (el.yogaNode) {
        applyStyles(el.yogaNode, nextValue)
      }
    } else if (key === 'internal_transform') {
      el.internal_transform = nextValue
    }
  },
  insert(el, parent, anchor) {
    parent.insertNode(el, anchor)
  },
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
    return (index >= 0 && node.parentNode.childNodes[index + 1]) || null
  },

  // TODO: When is this called?
  setElementText(node, text) {
    // console.log('setElementText', node, text)
    const textNode = node.childNodes.find(
      (node) => node.nodeName === '#text'
    ) as TextNode | null
    if (textNode) {
      textNode.nodeValue = text
    } else {
      node.insertNode(new TextNode(text))
    }
    node.yogaNode?.markDirty()
  },
  setText(node, text) {
    // console.log('setText', text)
    if (node.nodeName === '#text' || node.nodeName === '#comment') {
      node.nodeValue = text
      // mark the closest parent as dirty
      let parent = node.parentNode
      while (parent && !parent.yogaNode) {
        parent = parent.parentNode
      }
      parent?.yogaNode?.markDirty()
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

export interface TuiAppMountOptions {
  /**
   * Render the application once and exit.
   */
  renderOnce: boolean
}

export interface TuiApp extends Omit<App<TODO>, 'mount'> {
  mount(options?: Partial<TuiAppMountOptions>): TuiApp

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
}

export type RootProps = Record<string, unknown>

const noop = () => {}

function createApp(
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

  const app = baseCreateApp(RootApp, {
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
  newApp.component('TuiText', TuiText)
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
  newApp.mount = ({ renderOnce = false } = {}) => {
    cliCursor.hide(stdout)
    log.clear()

    stdout.on('resize', onResize)
    const rootEl = new DOMElement('tui-root')
    rootEl.toString = () => `<Root>`

    newApp.provide(rootNodeSymbol, rootEl)
    newApp.provide(renderOnceSymbol, renderOnce)

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

  const removeOnExitListener = onExit((code, signal) => {
    console.log({ code, signal })
    if (code !== 0) {
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
// export * from './vue-runtimeExports'

export {
  useLog,
  logSymbol,
  useRootNode,
  rootNodeSymbol,
  stdoutSymbol,
  useStdout,
} from './injectionSymbols'

export * from './components'

export class TuiError extends Error {
  code: number | null
  signal: Signal | null

  constructor(code: number | null, signal: Signal | null) {
    super(`Program Interrupted with "${signal}" ${code ? `(${code})` : ''}`)
    this.code = code
    this.signal = signal
  }
}
