import type { RGBA } from '@opentui/core'

/** A color accepted by OpenTUI: a hex/name string or an {@link RGBA} instance. */
export type ColorInput = string | RGBA

/** A length: a number of cells, `'auto'`, or a percentage string like `'50%'`. */
export type Dimension = number | 'auto' | `${number}%`

/** Flexbox `flex-direction`. */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'

/** Flexbox `align-items` / `align-self`. */
export type Align = 'flex-start' | 'center' | 'flex-end' | 'stretch'

/** Flexbox `justify-content`. */
export type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'

/** CSS-ish positioning mode. */
export type Position = 'static' | 'relative' | 'absolute'

/** How overflowing content is handled. */
export type Overflow = 'visible' | 'hidden' | 'scroll'

/** Border preset understood by OpenTUI. */
export type BorderStyle = 'single' | 'double' | 'rounded' | 'heavy' | 'none'

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

/** A single choice in a {@link Select}. */
export interface SelectOption {
  /** Label shown for the option. */
  name: string
  /** Secondary text shown alongside the name. */
  description?: string
  /** Arbitrary value associated with the option. */
  value?: unknown
}

/**
 * Props accepted by {@link Text}. Text content is provided through the default
 * slot. Boolean style props are folded into OpenTUI's `attributes` bitmask.
 */
export interface TextProps {
  /**
   * Foreground (text) color.
   */
  fg?: ColorInput

  /**
   * Background color.
   */
  bg?: ColorInput

  /**
   * Render the text in a bold/bright weight.
   */
  bold?: boolean

  /**
   * Render the text dimmed (reduced intensity).
   */
  dim?: boolean

  /**
   * Render the text in italics.
   */
  italic?: boolean

  /**
   * Underline the text.
   */
  underline?: boolean

  /**
   * Make the text blink. Terminal support varies.
   */
  blink?: boolean

  /**
   * Swap the foreground and background colors.
   */
  inverse?: boolean

  /**
   * Draw a line through the text.
   */
  strikethrough?: boolean

  /**
   * How text wraps when it overflows its line.
   */
  wrap?: 'none' | 'char' | 'word'
}
