import { type FunctionalComponent, h } from '@vue/runtime-core'
import type {
  BorderStyle,
  ColorInput,
  Dimension,
  FlexDirection,
  Align,
  Justify,
  Overflow,
  Position,
} from './types'

/**
 * Props accepted by {@link Box}. These mirror OpenTUI's `BoxRenderable`
 * options (layout is real flexbox, handled natively by OpenTUI) and are
 * forwarded as-is to the underlying renderable.
 */
export interface BoxProps {
  // Sizing
  width?: Dimension
  height?: Dimension
  minWidth?: Dimension
  minHeight?: Dimension
  maxWidth?: Dimension
  maxHeight?: Dimension

  // Flex layout
  flexDirection?: FlexDirection
  flexGrow?: number
  flexShrink?: number
  flexBasis?: number | 'auto'
  flexWrap?: 'no-wrap' | 'wrap' | 'wrap-reverse'
  alignItems?: Align
  alignSelf?: Align
  justifyContent?: Justify
  gap?: number | `${number}%`
  rowGap?: number | `${number}%`
  columnGap?: number | `${number}%`

  // Positioning
  position?: Position
  top?: Dimension
  right?: Dimension
  bottom?: Dimension
  left?: Dimension
  zIndex?: number
  overflow?: Overflow

  // Spacing — OpenTUI expands the `margin`/`padding` shorthands natively.
  margin?: Dimension
  marginX?: Dimension
  marginY?: Dimension
  marginTop?: Dimension
  marginRight?: Dimension
  marginBottom?: Dimension
  marginLeft?: Dimension
  padding?: number | `${number}%`
  paddingX?: number | `${number}%`
  paddingY?: number | `${number}%`
  paddingTop?: number | `${number}%`
  paddingRight?: number | `${number}%`
  paddingBottom?: number | `${number}%`
  paddingLeft?: number | `${number}%`

  // Appearance
  backgroundColor?: ColorInput
  border?: boolean
  borderStyle?: BorderStyle
  borderColor?: ColorInput
  focusedBorderColor?: ColorInput
  title?: string
  titleAlignment?: 'left' | 'center' | 'right'

  // Misc
  visible?: boolean
  opacity?: number
  focusable?: boolean
}

/**
 * A flexbox container — the terminal equivalent of a `<div>`. Maps to OpenTUI's
 * `BoxRenderable`, which owns layout (real flexbox), borders, padding/margin and
 * background natively, so {@link BoxProps} are forwarded to it unchanged.
 *
 * Children go in the default slot.
 *
 * @example
 * ```vue
 * <Box border borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
 *   <Text bold>Title</Text>
 *   <Text>Body</Text>
 * </Box>
 * ```
 */
export const Box: FunctionalComponent<BoxProps> = (_props, { slots, attrs }) =>
  h('box', attrs, slots.default?.())

Box.displayName = 'Box'
