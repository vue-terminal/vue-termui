import { DOMNode } from './dom'

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
