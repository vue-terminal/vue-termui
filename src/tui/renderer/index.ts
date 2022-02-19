import { createRenderer } from '@vue/runtime-core'
import { onExit } from '../deps/signal-exit'
import type { App, Component } from '@vue/runtime-core'

export interface TuiNode {}
export interface TuiElement extends TuiNode {}

const { render, createApp: baseCreateApp } = createRenderer<
  TuiNode,
  TuiElement
>({
  patchProp(el, key, prevValue, nextValue) {
    console.log('patchProp', { el, key, nextValue })
  },
  insert: (el, parent) => {
    console.log('insert', { el, parent })
  },
  remove(el) {
    console.log('remove', { el })
  },
  createElement(type) {
    console.log('createElement', type)
    return {}
  },
  createComment(text) {
    console.log('createComment', text)
    return {}
  },
  createText(text) {
    console.log('createText', text)
    return {}
  },

  parentNode(node) {
    console.log('parentNode', node)
    return null
  },
  nextSibling(node) {
    console.log('nextSibling', node)
    return null
  },

  setElementText(node, text) {
    console.log('setElementText', node, text)
  },
  setText(node, text) {
    console.log('setText', node, text)
  },
  cloneNode(node) {
    console.log('clone')
    return node
  },
  setScopeId(el, id) {
    console.log('setScopeId', el, id)
  },
})

type TODO = any

export interface TuiApp extends Omit<App<TODO>, 'mount'> {
  mount(): void
}

function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null
) {
  const app = baseCreateApp(rootComponent, rootProps)
  const mount = app.mount
  // TODO: actually build a host
  const host = { ROOT: true }
  const newApp = app as unknown as TuiApp
  newApp.mount = () => {
    mount(host)
  }

  onExit(() => {
    newApp.unmount()
  })

  return newApp
}

export { render, createApp }

// re-export Vue core APIs
export * from '@vue/runtime-core'
