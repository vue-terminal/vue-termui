import type { Renderable, RGBA } from '@opentui/core'

/**
 * A color accepted by OpenTUI: a hex/name string or an {@link RGBA} instance.
 */
export type ColorInput = string | RGBA

/**
 * The terminal element behind every renderable component, as exposed by
 * template refs and `$el`. Alias of OpenTUI's `Renderable` so apps never
 * import from `@opentui/core`; each component narrows it to its own element
 * type (`BoxElement`, `InputElement`, …).
 */
export type TuiElement = Renderable

/**
 * A parsed mouse event, as delivered by OpenTUI to `@mouse-down`, `@mouse-move`,
 * etc. handlers. Mirrors the public surface of OpenTUI's `MouseEvent` so
 * handlers stay typed without importing from `@opentui/core`.
 */
export interface MouseEvent {
  /**
   * What happened: `'down'`, `'up'`, `'move'`, `'drag'`, `'drag-end'`,
   * `'drop'`, `'over'`, `'out'` or `'scroll'`.
   */
  readonly type: 'down' | 'up' | 'move' | 'drag' | 'drag-end' | 'drop' | 'over' | 'out' | 'scroll'

  /**
   * Pressed button: `0` left, `1` middle, `2` right, `4` wheel-up, `5`
   * wheel-down.
   */
  readonly button: number

  /**
   * Column of the event, in terminal cells.
   */
  readonly x: number

  /**
   * Row of the event, in terminal cells.
   */
  readonly y: number

  /**
   * Modifier keys held during the event.
   */
  readonly modifiers: {
    readonly shift: boolean
    readonly alt: boolean
    readonly ctrl: boolean
  }

  /**
   * Scroll direction and amount; only present on `'scroll'` events.
   */
  readonly scroll?: {
    direction: 'up' | 'down' | 'left' | 'right'
    delta: number
  }

  /**
   * The element under the cursor, if any.
   */
  readonly target: TuiElement | null

  /**
   * The element the event was captured on (e.g. the dragged element), when it
   * differs from {@link target}.
   */
  readonly source?: TuiElement

  /**
   * Whether a drag is in progress.
   */
  readonly isDragging?: boolean

  /**
   * Whether {@link preventDefault} was called.
   */
  readonly defaultPrevented: boolean

  /**
   * Whether {@link stopPropagation} was called.
   */
  readonly propagationStopped: boolean

  /**
   * Marks the event handled so OpenTUI stops processing it.
   */
  preventDefault(): void

  /**
   * Stops the event from bubbling to ancestor elements.
   */
  stopPropagation(): void
}

/**
 * A length: a number of cells, `'auto'`, or a percentage string like `'50%'`.
 */
export type Dimension = number | 'auto' | `${number}%`

/**
 * Flexbox `flex-direction`.
 */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse'

/**
 * Flexbox `align-items` / `align-self`.
 */
export type Align = 'flex-start' | 'center' | 'flex-end' | 'stretch'

/**
 * Flexbox `justify-content`.
 */
export type Justify =
  | 'flex-start'
  | 'center'
  | 'flex-end'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'

/**
 * CSS-ish positioning mode.
 */
export type Position = 'static' | 'relative' | 'absolute'

/**
 * How overflowing content is handled.
 */
export type Overflow = 'visible' | 'hidden' | 'scroll'

/**
 * Border preset understood by OpenTUI.
 */
export type BorderStyle = 'single' | 'double' | 'rounded' | 'heavy' | 'none'
