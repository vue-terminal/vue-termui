import {
  CommentNode,
  DOMElement,
  DOMElementName,
  DOMNode,
  TextNode,
} from './dom'
import type { OutputTransformer } from './Output'
import { applyStyles } from './styles'

export function nextSibling(node: DOMNode) {
  if (!node.parentNode) return null
  const index = node.parentNode.childNodes.indexOf(node)
  return (index >= 0 && node.parentNode.childNodes[index + 1]) || null
}

export function previousSibling(node: DOMNode) {
  if (!node.parentNode) return null
  const index = node.parentNode.childNodes.indexOf(node)
  return (index >= 0 && node.parentNode.childNodes[index - 1]) || null
}

export function remove(node: DOMNode) {
  // recurse for children
  if (node.nodeName !== '#comment' && node.nodeName !== '#text') {
    node.childNodes.map(remove)
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

export function patchProp(
  el: DOMElement,
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
}

export function insert(el: DOMNode, parent: DOMElement, anchor: DOMNode) {
  parent.insertNode(el, anchor)
}

export function createElement(type: DOMElementName) {
  // TODO: runtime check valid values
  // console.log('createElement', type)
  return new DOMElement(type)
}

export function createComment(text: string) {
  // console.log('createComment', text)
  return new CommentNode(text)
}

export function createText(text: string) {
  // console.log('createText', text)
  return new TextNode(text)
}

export function parentNode(node: DOMNode) {
  // console.log('parentNode', node)
  return node.parentNode
}

// TODO: When is this called?
export function setElementText(node: DOMElement, text: string) {
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
}

export function setText(node: DOMNode, text: string) {
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
    setElementText(node, text)
  }
}

export function cloneNode(node: DOMNode) {
  return node.clone()
}
