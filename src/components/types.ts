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
