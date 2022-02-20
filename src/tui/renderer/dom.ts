import Yoga from 'yoga-layout-prebuilt'
import type { OutputTransformer } from './Output'
import { Styles } from './styles'
import { measureTextNode } from './text'

export class TuiNode {
  parentNode: DOMElement | null
  yogaNode?: Yoga.YogaNode
  internal_static?: boolean
  style: Styles = {}

  constructor(parentNode: DOMElement | null) {
    this.parentNode = parentNode
  }
}

export type DOMElementName = 'ink-text' | 'ink-virtual-text' | 'ink-root'
export type NodeName = DOMElementName | '#text' | '#comment'

export class DOMElement extends TuiNode {
  nodeName: DOMElementName
  childNodes: DOMNode[] = []
  internal_transform?: OutputTransformer
  staticNode?: DOMElement

  constructor(nodeName: DOMElementName, parentNode: DOMElement | null = null) {
    super(parentNode)
    this.nodeName = nodeName

    if (nodeName !== 'ink-virtual-text') {
      this.yogaNode = Yoga.Node.create()
      if (nodeName === 'ink-text') {
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
}

export class CommentNode extends TuiNode {
  nodeName = '#comment' as const
  nodeValue: string

  constructor(nodeValue: string, parentNode: DOMElement | null = null) {
    super(parentNode)
    this.nodeValue = nodeValue
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
