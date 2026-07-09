import { type FunctionalComponent, h } from '@vue/runtime-core'

/**
 * Props accepted by {@link Newline}.
 */
export interface NewlineProps {
  /**
   * How many line breaks to insert.
   *
   * @default 1
   */
  count?: number
}

/**
 * Inserts one or more line breaks. Renders a `<tui-text>` node whose content is
 * `count` newline characters — handy for spacing rows of text apart.
 *
 * @example
 * ```vue
 * <Text>first</Text>
 * <Newline :count="2" />
 * <Text>second</Text>
 * ```
 */
export const Newline: FunctionalComponent<NewlineProps> = (props) =>
  h('tui-text', '\n'.repeat(props.count ?? 1))

Newline.displayName = 'Newline'
Newline.props = {
  count: { type: Number, default: 1 },
}
