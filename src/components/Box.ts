import { type FunctionalComponent, h } from '@vue/runtime-core'
import type { BoxOptions } from '@opentui/core'

/**
 * Props accepted by {@link Box}. These are OpenTUI's native `BoxRenderable`
 * options (layout is real flexbox, handled natively) and are forwarded as-is
 * to the underlying renderable.
 */
export type BoxProps = BoxOptions

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
