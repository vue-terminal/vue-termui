import cliBoxes from 'cli-boxes'
import { colorize } from './textColor'
import { DOMElement } from './dom'
import { Output } from './output'
import stringWidth from 'string-width'

export function renderBorders(
  x: number,
  y: number,
  node: DOMElement, // TODO: should be a tui:box
  output: Output
) {
  if (typeof node.style.borderStyle === 'string' && node.style.borderStyle) {
    const width = node.yogaNode!.getComputedWidth()
    const height = node.yogaNode!.getComputedHeight()
    const color = node.style.borderColor
    const box = cliBoxes[node.style.borderStyle]
    const title = node.style.title ?? ''

    /**
     * TODO: avoid calling stringWidth twice (also in output). Probably box outputting should be refactored
     */
    const textWidth = title ? stringWidth(title) : 0

    const topBorder = colorize(
      box.topLeft +
        title +
        box.top.repeat(width - 2 - textWidth) +
        box.topRight,
      color,
      'foreground'
    )

    const rightBorder = (
      colorize(box.right, color, 'foreground') + '\n'
    ).repeat(height - 2)

    const leftBorder = (colorize(box.left, color, 'foreground') + '\n').repeat(
      height - 2
    )

    const bottomBorder = colorize(
      box.bottomLeft + box.bottom.repeat(width - 2) + box.bottomRight,
      color,
      'foreground'
    )

    output.write(x, y, topBorder, { transformers: [] })
    output.write(x, y + 1, leftBorder, { transformers: [] })
    output.write(x + width - 1, y + 1, rightBorder, { transformers: [] })
    output.write(x, y + height - 1, bottomBorder, { transformers: [] })
  }
}
