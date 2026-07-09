import { type MarkdownOptions, SyntaxStyle } from '@opentui/core'
import { type FunctionalComponent, h } from '@vue/runtime-core'
import { optionalBooleanProps } from './utils'

// Re-exported so consumers can build a `syntaxStyle` (and type theme maps)
// without reaching into `@opentui/core` directly.
export { SyntaxStyle } from '@opentui/core'
export type { StyleDefinitionInput } from '@opentui/core'

/**
 * Props accepted by {@link Markdown}. Extends OpenTUI's native
 * `MarkdownRenderable` options (`content`, `fg`/`bg`, `tableOptions`,
 * `renderNode`, …), which fall through to the underlying renderable.
 */
export interface MarkdownProps extends MarkdownOptions {
  /**
   * The markdown source to render.
   */
  content?: string

  /**
   * Token styles mapping scope names (`markup.heading.1`, `markup.raw`, …) to
   * colors/attributes. Build one with {@link SyntaxStyle.fromStyles}; it is
   * **required** — just like the underlying `MarkdownRenderable`. See the
   * playground's `markdown-themes.ts` for ready-to-copy presets.
   */
  syntaxStyle: SyntaxStyle
}

/**
 * Renders a block of Markdown, mapping to OpenTUI's `MarkdownRenderable`. Pass
 * the source through `content`; headings, lists, emphasis, code fences, tables
 * and links are styled from the required `syntaxStyle` (build one with
 * {@link SyntaxStyle.fromStyles} — see the playground's `markdown-themes.ts` for
 * copy-paste presets). Markdown markers (`#`, `**`, …) are concealed by default
 * — set `:conceal="false"` to show them.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Markdown, SyntaxStyle } from 'vue-termui'
 * const syntaxStyle = SyntaxStyle.fromStyles({ default: { fg: '#e6edf3' } })
 * </script>
 *
 * <template>
 *   <Markdown content="# vue-termui" :syntax-style="syntaxStyle" />
 * </template>
 * ```
 */
export const Markdown: FunctionalComponent<MarkdownProps> = (props, { attrs }) => {
  // `content`, `fg`/`bg`, `tableOptions`, `renderNode`, `id`, `width`, … fall
  // through as attrs so they only reach the renderable when actually set,
  // leaving unset options at the renderable's defaults.

  return h('tui-markdown', {
    ...attrs,
    // Coerce and forward each optional boolean only when set, so an unset prop
    // keeps the renderable's own default — e.g. `conceal` stays `true`, and
    // `conceal`/`conceal=""` read as `true` (see `optionalBooleanProps`).
    ...optionalBooleanProps(props, ['conceal', 'concealCode', 'streaming']),
    // required: seeded at element creation (see nodeOps) and kept in sync here
    syntaxStyle: props.syntaxStyle,
  })
}

Markdown.displayName = 'Markdown'
Markdown.inheritAttrs = false
Markdown.props = {
  syntaxStyle: { type: Object, required: true },
  // not to cast to boolean
  conceal: null,
  concealCode: null,
  streaming: null,
}
