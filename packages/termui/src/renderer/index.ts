import { createRenderer } from '@vue/runtime-core'
import { DOMElement, DOMNode } from './dom'
import {
  createComment,
  createElement,
  createText,
  insert,
  nextSibling,
  parentNode,
  patchProp,
  remove,
  setElementText,
  setText,
} from './nodeOpts'

export const { render, createApp: baseCreateApp } = createRenderer<
  DOMNode,
  DOMElement
>({
  insert,
  remove,

  patchProp,
  setElementText,
  setText,

  nextSibling,
  parentNode,

  createElement,
  createText,
  createComment,
})
