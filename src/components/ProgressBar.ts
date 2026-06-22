import { type FunctionalComponent, h } from '@vue/runtime-core'
import { Box } from './Box'
import { Text } from './Text'
import type { ColorInput } from './types'

/** Props accepted by {@link ProgressBar}. */
export interface ProgressBarProps {
  /** Current progress, between `0` and `max`. */
  value: number
  /** The value representing 100%. @default 1 */
  max?: number
  /** Total width of the bar, in cells. @default 25 */
  width?: number
  /** Color of the filled portion. */
  color?: ColorInput
  /** Color of the unfilled track. */
  trackColor?: ColorInput
  /** Character used to draw the bar. @default '█' */
  char?: string
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * A horizontal progress bar, composed from {@link Box} and {@link Text} (OpenTUI
 * has no native progress renderable). The filled portion is drawn in `color`,
 * the remainder in `trackColor`.
 *
 * @example
 * ```vue
 * <ProgressBar :value="downloaded" :max="total" :width="30" color="#42b883" />
 * ```
 */
export const ProgressBar: FunctionalComponent<ProgressBarProps> = (props) => {
  const max = props.max ?? 1
  const width = props.width ?? 25
  const char = props.char ?? '█'
  const ratio = max > 0 ? clamp(props.value / max, 0, 1) : 0
  const filled = Math.round(width * ratio)

  return h(Box, { flexDirection: 'row' }, () => [
    h(Text, { fg: props.color ?? '#42b883' }, () => char.repeat(filled)),
    h(Text, { fg: props.trackColor ?? '#3a3a3a' }, () => char.repeat(width - filled)),
  ])
}

ProgressBar.displayName = 'ProgressBar'
ProgressBar.props = {
  value: { type: Number, required: true },
  max: { type: Number, default: 1 },
  width: { type: Number, default: 25 },
  color: [String, Object],
  trackColor: [String, Object],
  char: { type: String, default: '█' },
}
