import { createRenderer } from '@vue/runtime-core'
import type { RendererNode, RendererElement } from '@vue/runtime-core'

export interface TuiNode {}
export interface TuiElement extends TuiNode {}

const { render, createApp } = createRenderer<TuiNode, TuiElement>({
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

// `render` is the low-level API
// `createApp` returns an app instance
export { render, createApp }

// re-export Vue core APIs
export * from '@vue/runtime-core'
