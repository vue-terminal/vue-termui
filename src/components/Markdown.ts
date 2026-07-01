import { type MarkdownOptions, SyntaxStyle } from '@opentui/core'
import { type FunctionalComponent, h } from '@vue/runtime-core'
import { propToOptionalBoolean } from './utils'

// Re-exported so consumers can build a custom `syntaxStyle` (and type theme
// maps) without reaching into `@opentui/core` directly.
export { SyntaxStyle } from '@opentui/core'
export type { StyleDefinitionInput } from '@opentui/core'

/**
 * Props accepted by {@link Markdown}. Extends OpenTUI's native
 * `MarkdownRenderable` options (`content`, `fg`/`bg`, `tableOptions`,
 * `renderNode`, …), which fall through to the underlying renderable.
 *
 * `syntaxStyle` is made optional: unlike the raw renderable, {@link Markdown}
 * mounts with a default style (see {@link getDefaultSyntaxStyle}), so passing
 * one is only needed to customize token colors.
 */
export interface MarkdownProps extends Omit<MarkdownOptions, 'syntaxStyle'> {
  /**
   * The markdown source to render.
   */
  content?: string

  /**
   * Token styles mapping scope names (`markup.heading.1`, `markup.raw`, …) to
   * colors/attributes. Defaults to {@link getDefaultSyntaxStyle}.
   */
  syntaxStyle?: SyntaxStyle
}

// A single default style shared across every `<Markdown>` (and the renderer's
// `markdown` host element). It is created lazily — `SyntaxStyle.fromStyles`
// needs the native render library, which only exists once a renderer is up —
// and memoized so the reference stays stable (the renderable only re-styles
// when the `syntaxStyle` identity changes).
let defaultSyntaxStyle: SyntaxStyle | undefined

/**
 * The default {@link SyntaxStyle} used by {@link Markdown} when no `syntaxStyle`
 * prop is provided. A terminal-friendly theme in the spirit of GitHub Dark
 * (with a Vue-green `# H1` for brand). It covers both the markdown structure
 * scopes (`markup.*`) *and* the code-syntax scopes (`keyword`, `string`,
 * `function`, …) so fenced code blocks, links, diffs and heading levels are all
 * colored — not just headings and inline code. Created lazily (the style needs
 * the native render library) and memoized so its identity stays stable.
 *
 * @internal
 */
export function getDefaultSyntaxStyle(): SyntaxStyle {
  if (!defaultSyntaxStyle) {
    defaultSyntaxStyle = SyntaxStyle.fromStyles({
      default: { fg: '#e6edf3' },

      // Markdown structure.
      'markup.heading': { fg: '#58a6ff', bold: true },
      'markup.heading.1': { fg: '#42b883', bold: true },
      'markup.heading.2': { fg: '#58a6ff', bold: true },
      'markup.heading.3': { fg: '#79c0ff', bold: true },
      'markup.bold': { fg: '#f0f6fc', bold: true },
      'markup.strong': { fg: '#f0f6fc', bold: true },
      'markup.italic': { fg: '#f0f6fc', italic: true },
      'markup.list': { fg: '#ff7b72' },
      'markup.quote': { fg: '#8b949e', italic: true },
      'markup.raw': { fg: '#a5d6ff', bg: '#161b22' },
      'markup.raw.block': { fg: '#a5d6ff', bg: '#161b22' },
      'markup.raw.inline': { fg: '#a5d6ff', bg: '#161b22' },
      'markup.link': { fg: '#58a6ff', underline: true },
      'markup.link.label': { fg: '#a5d6ff', underline: true },
      'markup.link.url': { fg: '#58a6ff', underline: true },

      // Code syntax highlighting inside fenced blocks.
      keyword: { fg: '#ff7b72', bold: true },
      string: { fg: '#a5d6ff' },
      comment: { fg: '#8b949e', italic: true },
      number: { fg: '#79c0ff' },
      function: { fg: '#d2a8ff' },
      type: { fg: '#ffa657' },
      operator: { fg: '#ff7b72' },
      variable: { fg: '#e6edf3' },
      property: { fg: '#79c0ff' },
      label: { fg: '#7ee787' },
      'punctuation.bracket': { fg: '#f0f6fc' },
      'punctuation.delimiter': { fg: '#c9d1d9' },
      'punctuation.special': { fg: '#8b949e' },

      // Diff fences.
      'diff.plus': { fg: '#3fb950' },
      'diff.minus': { fg: '#f85149' },

      // Concealed markdown markers.
      conceal: { fg: '#6e7681' },
    })
  }
  return defaultSyntaxStyle
}

/**
 * Renders a block of Markdown, mapping to OpenTUI's `MarkdownRenderable`. Pass
 * the source through `content`; headings, lists, emphasis, code fences, tables
 * and links are styled from `syntaxStyle` (a sensible default is used when
 * omitted). Markdown markers (`#`, `**`, …) are concealed by default — set
 * `:conceal="false"` to show them.
 *
 * @example
 * ```vue
 * <Markdown content="# vue-termui\n\nTerminal UIs with **Vue**." />
 * ```
 */
export const Markdown: FunctionalComponent<MarkdownProps> = (props, { attrs }) => {
  // `content`, `fg`/`bg`, `tableOptions`, `renderNode`, `id`, `width`, … fall
  // through as attrs so they only reach the renderable when actually set,
  // leaving unset options at the renderable's defaults.
  const options: Record<string, unknown> = {
    ...attrs,
    // pass downn undefined to let defaults take over,
    // anything else than false is true, so conceal and conceal="" are true
    conceal: propToOptionalBoolean(props.conceal),
    concealCode: propToOptionalBoolean(props.concealCode),
    streaming: propToOptionalBoolean(props.streaming),
  }

  // Always provide a style so content renders styled out of the box; the user's
  // wins when they pass one.
  options.syntaxStyle = props.syntaxStyle ?? getDefaultSyntaxStyle()

  return h('markdown', options)
}

Markdown.displayName = 'Markdown'
Markdown.props = {
  syntaxStyle: Object,
  // not to cast to boolean
  conceal: null,
  concealCode: null,
  streaming: null,
}
