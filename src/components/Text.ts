import { TextAttributes } from '@opentui/core'
import { type FunctionalComponent, h, type PropType } from '@vue/runtime-core'
import type { ColorInput, TextProps } from './types'

/**
 * Folds the boolean style props into OpenTUI's single `attributes` bitmask.
 */
function toAttributes(props: TextProps): number {
  let attributes = TextAttributes.NONE
  if (props.bold) attributes |= TextAttributes.BOLD
  if (props.dim) attributes |= TextAttributes.DIM
  if (props.italic) attributes |= TextAttributes.ITALIC
  if (props.underline) attributes |= TextAttributes.UNDERLINE
  if (props.blink) attributes |= TextAttributes.BLINK
  if (props.inverse) attributes |= TextAttributes.INVERSE
  if (props.strikethrough) attributes |= TextAttributes.STRIKETHROUGH
  return attributes
}

/**
 * Styled text. Maps to OpenTUI's `TextRenderable`. The text itself is the
 * default slot; the boolean props (`bold`, `italic`, …) are combined into the
 * renderable's `attributes` bitmask, and `fg`/`bg` set the colors.
 *
 * @example
 * ```vue
 * <Text fg="#42b883" bold>vue-termui</Text>
 * ```
 */
export const Text: FunctionalComponent<TextProps> = (props, { slots }) =>
  h(
    'text',
    {
      fg: props.fg,
      bg: props.bg,
      attributes: toAttributes(props),
      wrapMode: props.wrap,
    },
    slots.default?.(),
  )

Text.displayName = 'Text'
// Runtime prop declaration so the boolean props are coerced (e.g. `<Text bold>`
// → `true`) and the color/wrap props are extracted instead of falling through
// as attributes onto the host `<text>` element.
Text.props = {
  fg: [String, Object] as PropType<ColorInput>,
  bg: [String, Object] as PropType<ColorInput>,
  bold: Boolean,
  dim: Boolean,
  italic: Boolean,
  underline: Boolean,
  blink: Boolean,
  inverse: Boolean,
  strikethrough: Boolean,
  wrap: String as PropType<TextProps['wrap']>,
}
