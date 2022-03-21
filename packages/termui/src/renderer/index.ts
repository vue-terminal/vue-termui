import { createRenderer } from '@vue/runtime-core'
import {
  CommentNode,
  DOMElement,
  DOMNode,
  TextNode,
  DOMElementName,
} from './dom'
import { applyStyles } from './styles'
import { OutputTransformer } from './Output'
import { nextSibling, remove } from './nodeOpts'

export const { render, createApp: baseCreateApp } = createRenderer<
  DOMNode,
  DOMElement
>({
  patchProp(
    el,
    key: keyof DOMElement,
    prevValue: Record<any, any> | null | undefined,
    nextValue: Record<any, any> | null | undefined
  ) {
    // console.log('TODO: patchProp', { el, key, nextValue })
    if (key === 'style') {
      nextValue = nextValue || {}
      // ensure any previously existing value is erased with undefined
      for (const styleProperty in prevValue) {
        if (!(styleProperty in nextValue)) {
          nextValue[styleProperty] = undefined
        }
      }
      el.style = nextValue
      if (el.yogaNode) {
        applyStyles(el.yogaNode, nextValue)
      }
    } else if (key === 'internal_transform') {
      el.internal_transform = nextValue as OutputTransformer
    }
  },
  insert(el, parent, anchor) {
    parent.insertNode(el, anchor)
  },
  remove,
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
  nextSibling,

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
    return node.clone()
  },
  // setScopeId(el, id) {
  //   console.log('setScopeId', el, id)
  // },
})
