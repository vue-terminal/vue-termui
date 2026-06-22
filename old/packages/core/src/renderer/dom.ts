import Yoga from 'yoga-layout-prebuilt'
import { indentHTML } from '../utils/indentHTML'
import type { Focusable } from '../focus/types'
import type { OutputTransformer } from './Output'
import type { Styles } from './styles'
import { measureTextNode } from './text'

export class TuiNode {
  parentNode: DOMElement | null
  // TODO: make this mandatory but with null or undefined and create more types in DOMElement
  yogaNode?: Yoga.YogaNode
  internal_static?: boolean
  internal_transform?: OutputTransformer
  style: Styles = {}
  focusable: Focusable | null = null

  constructor(parentNode: DOMElement | null) {
    this.parentNode = parentNode
  }

  clone(): DOMNode {
    // this must be implemented by each extend
    throw new Error('clone method not implemented')
  }

  toString(indent?: boolean) {
    return `<??></>`
  }
}

export type DOMElementName =
  | 'tui:text'
  | 'tui:virtual-text'
  | 'tui:root'
  | 'tui:box'
export type NodeName = DOMElementName | '#text' | '#comment'

export class DOMElement extends TuiNode {
  nodeName: DOMElementName
  childNodes: DOMNode[] = []
  staticNode?: DOMElement

  constructor(nodeName: DOMElementName, parentNode: DOMElement | null = null) {
    super(parentNode)
    this.nodeName = nodeName
    // text elements create their yoga nodes when they are inserted
    // because they need to know their parent to become a virtual text (no yoga node)
    // or a regular text node
    if (nodeName !== 'tui:text' && nodeName !== 'tui:virtual-text') {
      this.ensureYogaNode()
    }
  }

  clone(): DOMElement {
    const copy = new DOMElement(this.nodeName, this.parentNode)
    copy.internal_static = this.internal_static
    copy.childNodes = this.childNodes.map((node) => node.clone())
    if (this.yogaNode && copy.yogaNode) {
      this.yogaNode.copyStyle(copy.yogaNode)
    }
    // copy.staticNode // TODO:
    // cannot be copied because it contain references to props
    // copy.internal_transform = this.internal_transform

    return copy
  }

  toString(indent?: boolean) {
    const html = `<${this.nodeName}>
${this.childNodes.join('\n')}
</${this.nodeName}>`

    return indent || this.nodeName === 'tui:root' ? indentHTML(html) : html
  }

  insertNode(el: DOMNode, anchor?: DOMNode | null) {
    if (
      (this.nodeName === 'tui:text' || this.nodeName === 'tui:virtual-text') &&
      el.nodeName === 'tui:text'
    ) {
      el.nodeName = 'tui:virtual-text'
    } else if (
      this.nodeName !== 'tui:text' &&
      this.nodeName !== 'tui:virtual-text' &&
      el.nodeName == '#text'
    ) {
      // TODO: Fragment!
    }

    // TODO: is anchor is fragment, keep track of it as it should be removed with this node

    if (el.nodeName !== '#text' && el.nodeName !== '#comment') {
      el.ensureYogaNode()
    }

    let yogaIndex = 0
    let insertAt = 0
    const totalChildNodes = this.childNodes.length

    for (insertAt = 0; insertAt < totalChildNodes; insertAt++) {
      const node = this.childNodes[insertAt]
      if (node === anchor) {
        // we found the anchor, we can stop with the current yogaIndex value
        break
      }
      // Only increment the index if the node isn't a fragment
      if (isDOMElement(node)) {
        yogaIndex++
      }
    }

    if (insertAt < totalChildNodes) {
      this.childNodes.splice(insertAt, 0, el)
    } else {
      yogaIndex = -1
      this.childNodes.push(el)
    }

    if (this.yogaNode && el.yogaNode) {
      // TODO: if child already has a parent, it has to be removed first
      this.yogaNode.insertChild(
        el.yogaNode,
        yogaIndex >= 0 ? yogaIndex : this.yogaNode.getChildCount()
      )
    }
    el.parentNode = this
  }

  ensureYogaNode() {
    if (!this.yogaNode && this.nodeName !== 'tui:virtual-text') {
      this.yogaNode = Yoga.Node.create()
      if (this.nodeName === 'tui:text') {
        this.yogaNode.setMeasureFunc(measureTextNode.bind(null, this))
      }
    }
  }
}

export class TextNode extends TuiNode {
  nodeName = '#text' as const
  nodeValue: string

  constructor(nodeValue: string, parentNode: DOMElement | null = null) {
    super(parentNode)
    this.nodeValue = nodeValue
  }

  clone(): TextNode {
    return new TextNode(this.nodeValue, this.parentNode)
  }

  toString(): string {
    return this.nodeValue
    // return `<#text>${this.nodeValue}</>`
  }
}

export class CommentNode extends TuiNode {
  nodeName = '#comment' as const
  nodeValue: string

  constructor(nodeValue: string, parentNode: DOMElement | null = null) {
    super(parentNode)
    this.nodeValue = nodeValue
  }

  clone(): CommentNode {
    return new CommentNode(this.nodeValue, this.parentNode)
  }

  toString(): string {
    return `<!--${this.nodeValue}-->`
  }
}

export type DOMNode<T = { nodeName: NodeName }> = T extends {
  nodeName: infer U
}
  ? U extends '#text'
    ? TextNode
    : U extends '#comment'
    ? CommentNode
    : DOMElement
  : never

// export function createDOMNode<N extends NodeName>(nodeName: N): DOMNode<N> {
//   return {
//     nodeName,
//     parentNode: null,
//     childNodes: [],
//   }
// }

export function getMaxWidth(yogaNode: Yoga.YogaNode) {
  return (
    yogaNode.getComputedWidth() -
    yogaNode.getComputedPadding(Yoga.EDGE_LEFT) -
    yogaNode.getComputedPadding(Yoga.EDGE_RIGHT) -
    yogaNode.getComputedBorder(Yoga.EDGE_LEFT) -
    yogaNode.getComputedBorder(Yoga.EDGE_RIGHT)
  )
}

export function isDOMElement(node: unknown): node is DOMElement {
  return !!node && node instanceof DOMElement
}
