import {
  CommentNode,
  DOMElement,
  DOMElementName,
  DOMNode,
  isDOMElement,
  TextNode,
} from './dom'
import type { OutputTransformer } from './Output'
import { applyStyles } from './styles'

/**
 * Retrieves the next sibling of the given node. Does not go through parent (like DOM Node.nextSibling()).
 *
 * @param node - node to be start at
 * @returns
 */
export function nextSibling(node: DOMNode) {
  if (!node.parentNode) return null
  const index = node.parentNode.childNodes.indexOf(node)
  return node.parentNode.childNodes[index + 1] || null
}

/**
 * Retrieves the previous sibling of the given node. Does not go through its parent (like DOM Node.nextSibling()).
 *
 * @param node - node to be start at
 * @returns
 */
export function previousSibling(node: DOMNode) {
  if (!node.parentNode) return null
  const index = node.parentNode.childNodes.indexOf(node)
  return node.parentNode.childNodes[index - 1] || null
}

/**
 * Retrieve the deepest left-most node in a tree. This is the first node in a DFS inorder traversal.
 *
 * @param node - node to start at
 * @returns the last node in the tree
 */
export function getFirstLeaf(node: DOMNode): DOMNode {
  let cursor: DOMNode = node
  while (isDOMElement(cursor) && cursor.childNodes.length > 0) {
    cursor = cursor.childNodes[0]
  }

  return cursor
}

/**
 * Retrieve the deepest right-most node in a tree. This is the last node in a DFS inorder traversal.
 *
 * @param node - node to start at
 * @returns the last node in the tree
 */
export function getLastLeaf(node: DOMNode): DOMNode {
  let cursor: DOMNode = node
  while (isDOMElement(cursor) && cursor.childNodes.length > 0) {
    cursor = cursor.childNodes[cursor.childNodes.length - 1]
  }

  return cursor
}

/**
 * Gets the previous node in the tree traversing parent's children when possible. Returns `null` if we reached the end.
 * This allows the user to iterate again and have control of the loop.
 *
 * @param node - node to start at
 */
export function previousDeepSibling(node: DOMNode): DOMNode | null {
  const previous = previousSibling(node)
  // get the last leaf of the previous sibling or the parent
  return (previous && getLastLeaf(previous)) || node.parentNode
}

/**
 * Gets the next node in the tree traversing parent's children when possible. Returns `null` if we reached the end.
 * This allows the user to iterate again and have control of the loop.
 * @param node - node to start at
 */
export function nextDeepSibling(node: DOMNode): DOMNode | null {
  // check if the node has children and go to the first one
  if (isDOMElement(node) && node.childNodes.length > 0) {
    return node.childNodes[0]
  }

  // get the next sibling or
  let cursor: DOMNode | null = node
  let next: DOMNode | null = null

  while (!next && cursor) {
    next = nextSibling(cursor)
    cursor = cursor.parentNode
  }

  return next
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
