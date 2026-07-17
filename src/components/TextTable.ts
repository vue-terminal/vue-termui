import {
  createTextAttributes,
  isStyledText,
  parseColor,
  type ColorInput,
  type RGBA,
  type StyledText,
  type TextChunk,
  type TextTableCellContent,
  type TextTableContent,
  type TextTableOptions,
  type TextTableRenderable,
} from '@opentui/core'
import {
  Comment,
  Fragment,
  Text as TextVNode,
  defineComponent,
  h,
  isVNode,
  onMounted,
  shallowRef,
  warn,
  type FunctionalComponent,
  type VNode,
  type VNodeArrayChildren,
} from '@vue/runtime-core'
import {
  optionalBooleanProps,
  renderableEmits,
  renderableProps,
  setupRenderableEvents,
  type RenderableEventProps,
  type TuiComponent,
} from './utils'

/**
 * Text style props shared by {@link TableRow} and {@link TableCell}. Styles
 * cascade: chunk-level styles (from `content`) win over cell-level ones,
 * which win over row-level ones; the boolean attributes merge.
 */
export interface TableStyleProps {
  /**
   * Foreground color of the cell text.
   */
  fg?: ColorInput

  /**
   * Background color of the cell text.
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
}

/**
 * Props accepted by {@link TableRow}: the {@link TableStyleProps}, applied to
 * every cell of the row (cell and chunk styles win).
 */
export interface TableRowProps extends TableStyleProps {}

/**
 * A table row. Only valid as a direct child of {@link TextTable}; it renders
 * nothing by itself and only groups {@link TableCell} children.
 */
export const TableRow: FunctionalComponent<TableRowProps> = () => {
  if (process.env.NODE_ENV !== 'production') {
    warn('[vue-termui] <TableRow> must be a direct child of <TextTable>; it renders nothing.')
  }
  return null
}
TableRow.displayName = 'TableRow'

/**
 * Props accepted by {@link TableCell}. The cell text comes from the default
 * slot (plain strings and interpolations), or from `content` for styled runs
 * built with the `t`/`fg`/`bold`/… helpers. The boolean style props mirror
 * {@link Text} and are merged into each chunk; styles already present on a
 * `content` chunk win over the cell-level ones, which win over the row-level
 * ones.
 */
export interface TableCellProps extends TableStyleProps {
  /**
   * Styled cell content: a `StyledText` (from the `t` tag), a `TextChunk` or
   * an array of them (from `fg()`, `bold()`, …), or a plain string. Takes
   * precedence over the default slot.
   */
  content?: string | number | StyledText | TextChunk | TextChunk[]
}

/**
 * A table cell. Only valid inside a {@link TableRow}; it renders nothing by
 * itself — {@link TextTable} reads its props and slot to build the table
 * content.
 */
export const TableCell: FunctionalComponent<TableCellProps> = () => {
  if (process.env.NODE_ENV !== 'production') {
    warn('[vue-termui] <TableCell> must be a direct child of <TableRow>; it renders nothing.')
  }
  return null
}
TableCell.displayName = 'TableCell'

/**
 * Props accepted by {@link TextTable}. These are OpenTUI's native
 * `TextTableRenderable` options and are forwarded to the underlying
 * renderable. Instead of the `content` matrix, rows can be declared with
 * {@link TableRow}/{@link TableCell} children.
 *
 * `fg`, `bg`, `backgroundColor`, `borderBackgroundColor`, `attributes`,
 * `selectionBg` and `selectionFg` are constructor-only in OpenTUI (no
 * setters), so they are **not reactive** — remount with a `:key` to change
 * them.
 */
export interface TextTableProps extends TextTableOptions, RenderableEventProps {}

/**
 * A text table mapping to OpenTUI's `TextTableRenderable`: bordered rows and
 * columns of (optionally styled) text with per-cell wrapping, column sizing
 * (`columnWidthMode`, `columnFitter`) and mouse selection support.
 *
 * Content can be passed either as the raw `content` matrix (arrays of
 * `TextChunk[]` built with `t`/`bold`/`fg`/…, as in OpenTUI) or declaratively
 * with {@link TableRow} and {@link TableCell} in the default slot. The slot
 * form is compiled into the same matrix each render; cells whose content did
 * not change keep their identity so OpenTUI only rebuilds the cells that
 * actually changed. When both are given, `content` wins.
 *
 * @example
 * ```vue
 * <TextTable width="100%" borderStyle="rounded">
 *   <TableRow bold>
 *     <TableCell>Service</TableCell>
 *     <TableCell>Status</TableCell>
 *   </TableRow>
 *   <TableRow v-for="s in services" :key="s.name">
 *     <TableCell>{{ s.name }}</TableCell>
 *     <TableCell :fg="s.color">{{ s.status }}</TableCell>
 *   </TableRow>
 * </TextTable>
 * ```
 */
export const TextTable: TuiComponent<TextTableProps, TextTableRenderable> = defineComponent({
  name: 'TextTable',
  inheritAttrs: false,
  props: {
    ...renderableProps,
    content: null,
    // kept optional so unset props preserve the renderable's defaults
    border: null,
    outerBorder: null,
    showBorders: null,
    selectable: null,
  },
  emits: {
    ...renderableEmits,
  },
  setup(props, { emit, attrs, slots }) {
    const table = shallowRef<TextTableRenderable | null>(null)

    onMounted(() => {
      const el = table.value
      if (!el) return

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, props)
    })

    // Previous slot-built content, so unchanged cells keep their identity
    // across re-renders (OpenTUI diffs cells by reference).
    let prevContent: TextTableContent | null = null

    return (): VNode => {
      const content =
        (props.content as TextTableContent | undefined) ??
        (prevContent = buildTableContent(slots.default?.(), prevContent))

      return h('tui-text-table', {
        ...attrs,
        ...optionalBooleanProps(props, [
          'border',
          'outerBorder',
          'showBorders',
          'selectable',
          'focusable',
        ]),
        content,
        ref: table,
      })
    }
  },
})

/**
 * Flattens slot results into component vnodes, unwrapping fragments (`v-for`)
 * and dropping comments (`v-if` placeholders) and stray whitespace.
 */
function flattenSlotVNodes(children: VNodeArrayChildren | undefined, out: VNode[] = []): VNode[] {
  if (!children) return out
  for (const child of children) {
    if (child == null || typeof child === 'boolean' || typeof child === 'string') continue
    if (Array.isArray(child)) {
      flattenSlotVNodes(child, out)
    } else if (isVNode(child)) {
      if (child.type === Fragment) {
        flattenSlotVNodes(child.children as VNodeArrayChildren, out)
      } else if (child.type !== Comment) {
        out.push(child)
      }
    }
  }
  return out
}

/**
 * Invokes a component vnode's default slot without mounting it. Raw slots
 * (not normalized by Vue) may return a single child or even a bare string, so
 * the result is normalized into an array.
 */
function defaultSlotChildren(vnode: VNode): VNodeArrayChildren {
  const { children } = vnode
  if (children && typeof children === 'object' && !Array.isArray(children)) {
    const slot = (children as { default?: () => unknown }).default
    const value = slot ? slot() : undefined
    if (value == null) return []
    return (Array.isArray(value) ? value : [value]) as VNodeArrayChildren
  }
  return []
}

/**
 * Collects the text of a cell's default slot: raw strings/numbers and text
 * vnodes (static text and `{{ }}` interpolations), through fragments.
 */
function slotText(children: unknown): string {
  if (children == null || typeof children === 'boolean') return ''
  if (typeof children === 'string' || typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(slotText).join('')
  if (isVNode(children)) {
    if (children.type === TextVNode) return slotText(children.children)
    if (children.type === Fragment) return slotText(children.children)
    if (process.env.NODE_ENV !== 'production' && children.type !== Comment) {
      warn(
        `[vue-termui] <TableCell> only accepts text in its slot; use the \`content\` prop with the t/fg/bold helpers for styled runs. Ignored: ${describeVNode(children)}.`,
      )
    }
  }
  return ''
}

function describeVNode(vnode: VNode): string {
  const { type } = vnode
  if (typeof type === 'string') return `<${type}>`
  if (typeof type === 'object' && type && 'name' in type && typeof type.name === 'string') {
    return `<${type.name}>`
  }
  if (typeof type === 'function' && 'displayName' in type) {
    return `<${(type as { displayName?: string }).displayName}>`
  }
  return String(type)
}

function colorEquals(a: RGBA | undefined, b: RGBA | undefined): boolean {
  return a === b || (!!a && !!b && a.equals(b))
}

function chunkEquals(a: TextChunk, b: TextChunk): boolean {
  return (
    a.text === b.text &&
    a.attributes === b.attributes &&
    colorEquals(a.fg, b.fg) &&
    colorEquals(a.bg, b.bg) &&
    a.link?.url === b.link?.url
  )
}

function cellEquals(a: TextTableCellContent, b: TextTableCellContent): boolean {
  if (!a || !b) return a === b
  return a.length === b.length && a.every((chunk, i) => chunkEquals(chunk, b[i]!))
}

/**
 * The {@link TableStyleProps} of a row/cell vnode, resolved into chunk form:
 * parsed colors and an attributes bitmask.
 */
interface ResolvedTableStyle {
  fg: RGBA | undefined
  bg: RGBA | undefined
  attributes: number
}

const NO_STYLE: ResolvedTableStyle = { fg: undefined, bg: undefined, attributes: 0 }

function resolveStyleProps(vnode: VNode): ResolvedTableStyle {
  const props = (vnode.props ?? {}) as TableStyleProps
  return {
    fg: props.fg != null ? parseColor(props.fg) : undefined,
    bg: props.bg != null ? parseColor(props.bg) : undefined,
    attributes: createTextAttributes({
      // coerce bare attributes (`<TableCell bold>` arrives as '')
      bold: props.bold != null && props.bold !== false,
      dim: props.dim != null && props.dim !== false,
      italic: props.italic != null && props.italic !== false,
      underline: props.underline != null && props.underline !== false,
      blink: props.blink != null && props.blink !== false,
      inverse: props.inverse != null && props.inverse !== false,
      strikethrough: props.strikethrough != null && props.strikethrough !== false,
    }),
  }
}

/**
 * Builds a cell's chunks from a {@link TableCell} vnode: `content` prop first
 * (StyledText, chunk(s) or string), the default slot's text otherwise; then
 * merges the cell- and row-level style props in — chunk styles win over cell
 * styles, which win over row styles; attributes merge.
 */
function cellToChunks(vnode: VNode, rowStyle: ResolvedTableStyle): TextChunk[] {
  const { content } = (vnode.props ?? {}) as TableCellProps

  let chunks: TextChunk[]
  if (content != null) {
    if (isStyledText(content)) {
      chunks = content.chunks
    } else if (Array.isArray(content)) {
      chunks = content
    } else if (typeof content === 'object') {
      chunks = [content]
    } else {
      chunks = [{ __isChunk: true, text: String(content) }]
    }
  } else {
    chunks = [{ __isChunk: true, text: slotText(defaultSlotChildren(vnode)) }]
  }

  const cellStyle = resolveStyleProps(vnode)
  const fg = cellStyle.fg ?? rowStyle.fg
  const bg = cellStyle.bg ?? rowStyle.bg
  const attributes = cellStyle.attributes | rowStyle.attributes
  if (fg == null && bg == null && attributes === 0) return chunks

  return chunks.map((chunk) => ({
    __isChunk: true as const,
    text: chunk.text,
    fg: chunk.fg ?? fg,
    bg: chunk.bg ?? bg,
    attributes: (chunk.attributes ?? 0) | attributes,
    link: chunk.link,
  }))
}

/**
 * Compiles `<TableRow>`/`<TableCell>` slot vnodes into OpenTUI's
 * `TextTableContent` matrix, reusing the previous render's cell and row arrays
 * when their chunks are unchanged so `TextTableRenderable`'s reference-based
 * cell diff only rebuilds what changed.
 */
function buildTableContent(
  children: VNodeArrayChildren | undefined,
  prev: TextTableContent | null,
): TextTableContent {
  const rows: TextTableContent = []

  for (const rowVNode of flattenSlotVNodes(children)) {
    if (rowVNode.type !== TableRow) {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          `[vue-termui] <TextTable> only accepts <TableRow> children (wrapper components are not supported). Ignored: ${describeVNode(rowVNode)}.`,
        )
      }
      continue
    }

    const prevRow = prev?.[rows.length]
    let rowUnchanged = prevRow !== undefined
    const cells: TextTableCellContent[] = []
    const rowStyle = rowVNode.props ? resolveStyleProps(rowVNode) : NO_STYLE

    for (const cellVNode of flattenSlotVNodes(defaultSlotChildren(rowVNode))) {
      if (cellVNode.type !== TableCell) {
        if (process.env.NODE_ENV !== 'production') {
          warn(
            `[vue-termui] <TableRow> only accepts <TableCell> children (wrapper components are not supported). Ignored: ${describeVNode(cellVNode)}.`,
          )
        }
        continue
      }

      const chunks = cellToChunks(cellVNode, rowStyle)
      const prevCell = prevRow?.[cells.length]
      if (prevCell && cellEquals(prevCell, chunks)) {
        cells.push(prevCell)
      } else {
        cells.push(chunks)
        rowUnchanged = false
      }
    }

    rows.push(rowUnchanged && prevRow!.length === cells.length ? prevRow! : cells)
  }

  return rows
}
