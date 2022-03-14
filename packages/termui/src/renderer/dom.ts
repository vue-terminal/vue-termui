import Yoga from 'yoga-layout-prebuilt'
import type { OutputTransformer } from './Output'
import type { Styles } from './styles'
import { measureTextNode } from './text'

export class TuiNode {
  parentNode: DOMElement | null
  yogaNode?: Yoga.YogaNode
  internal_static?: boolean
  internal_transform?: OutputTransformer
  style: Styles = {}

  constructor(parentNode: DOMElement | null) {
    this.parentNode = parentNode
  }

  clone(): DOMNode {
    // this must be implemented by each extend
    throw new Error('clone method not implemented')
  }
}

export type DOMElementName =
  | 'tui-text'
  | 'tui-virtual-text'
  | 'tui-root'
  | 'tui-box'
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
    if (nodeName !== 'tui-text' && nodeName !== 'tui-virtual-text') {
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

  insertNode(el: DOMNode, anchor?: DOMNode | null) {
    if (
      (this.nodeName === 'tui-text' || this.nodeName === 'tui-virtual-text') &&
      el.nodeName === 'tui-text'
    ) {
      el.nodeName = 'tui-virtual-text'
    }

    if (el.nodeName !== '#text' && el.nodeName !== '#comment') {
      el.ensureYogaNode()
    }

    const insertAt = anchor ? this.childNodes.indexOf(anchor) : -1 // insert at the end

    if (insertAt >= 0) {
      this.childNodes.splice(insertAt, 0, el)
    } else {
      this.childNodes.push(el)
    }

    if (this.yogaNode && el.yogaNode) {
      this.yogaNode.insertChild(
        el.yogaNode,
        insertAt >= 0 ? insertAt : this.yogaNode.getChildCount()
      )
    }
    el.parentNode = this
  }

  ensureYogaNode() {
    if (!this.yogaNode && this.nodeName !== 'tui-virtual-text') {
      this.yogaNode = Yoga.Node.create()
      if (this.nodeName === 'tui-text') {
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
