import widestLine from 'widest-line'
import { DOMElement, DOMNode } from './dom'
import wrapAnsi from 'wrap-ansi'
import cliTruncate from 'cli-truncate'
import { Styles } from './styles'

export function measureTextNode(
  node: DOMNode,
  width: number
): { width: number; height: number } {
  const text =
    node.nodeName === '#text' || node.nodeName === '#comment'
      ? node.nodeValue
      : squashTextNodes(node)

  const dimensions = measureText(text)

  // Text fits into container, no need to wrap
  if (dimensions.width <= width) {
    return dimensions
  }

  // This is happening when <Box> is shrinking child nodes and Yoga asks
  // if we can fit this text node in a <1px space, so we just tell Yoga "no"
  if (dimensions.width >= 1 && width > 0 && width < 1) {
    return dimensions
  }

  const textWrap = node.style?.textWrap ?? 'wrap'
  const wrappedText = wrapText(text, width, textWrap)

  return measureText(wrappedText)
}

export interface TextSize {
  width: number
  height: number
}

const textSizeCache = new Map<string, TextSize>()

function measureText(text: string): TextSize {
  if (text.length === 0) {
    return {
      width: 0,
      height: 0,
    }
  }

  let size: TextSize | undefined = textSizeCache.get(text)
  if (!size) {
    const width = widestLine(text)
    const height = text.split('\n').length
    textSizeCache.set(text, (size = { width, height }))
  }

  return size
}

// Squashing text nodes allows to combine multiple text nodes into one and write
// to `Output` instance only once. For example, <Text>hello{' '}world</Text>
// is actually 3 text nodes, which would result 3 writes to `Output`.
// TODO:
// Also, this is necessary for libraries like tui-link (https://github.com/sindresorhus/tui-link),
// which need to wrap all children at once, instead of wrapping 3 text nodes separately.
export function squashTextNodes(node: DOMElement): string {
  let text = ''

  if (node.childNodes.length > 0) {
    for (const childNode of node.childNodes) {
      let nodeText = ''

      if (childNode.nodeName === '#text') {
        nodeText = childNode.nodeValue
      } else {
        if (
          childNode.nodeName === 'tui-text' ||
          childNode.nodeName === 'tui-virtual-text'
        ) {
          nodeText = squashTextNodes(childNode)
        }

        // Since these text nodes are being concatenated, `Output` instance won't be able to
        // apply children transform, so we have to do it manually here for each text node
        if (nodeText.length > 0 && childNode.internal_transform) {
          nodeText = childNode.internal_transform(nodeText)
        }
      }

      text += nodeText
    }
  }

  return text
}

// const wrappedTextCache: Record<string, string> = {}
const wrappedTextCache = new Map<string, string>()

export function wrapText(
  text: string,
  maxWidth: number,
  wrapType: Styles['textWrap']
): string {
  const cacheKey = text + String(maxWidth) + String(wrapType)

  let wrappedText = wrappedTextCache.get(cacheKey)

  if (!wrappedText) {
    wrappedText = text

    if (wrapType === 'wrap') {
      wrappedText = wrapAnsi(text, maxWidth, {
        trim: false,
        hard: true,
      })
    }

    if (wrapType!.startsWith('truncate')) {
      let position: 'end' | 'middle' | 'start' = 'end'

      if (wrapType === 'truncate-middle') {
        position = 'middle'
      }

      if (wrapType === 'truncate-start') {
        position = 'start'
      }

      wrappedText = cliTruncate(text, maxWidth, { position })
    }

    wrappedTextCache.set(cacheKey, wrappedText)
  }

  return wrappedText
}
