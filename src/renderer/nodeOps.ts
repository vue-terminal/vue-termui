import {
  type BaseRenderable,
  VRenderable,
  BoxRenderable,
  InputRenderable,
  MarkdownRenderable,
  type Renderable,
  type RenderContext,
  ScrollBoxRenderable,
  SelectRenderable,
  TabSelectRenderable,
  TextareaRenderable,
  TextNodeRenderable,
  TextRenderable,
} from '@opentui/core'
import type { RendererOptions } from '@vue/runtime-core'
import { propToOptionalBoolean } from '../components/utils'
import { installDomEventCompat } from './dom-events'

/**
 * Simplified renderable used as an invisible anchor for comment nodes and text
 * nodes, needed by Vue.
 *
 * @internal
 */
class AnchorRenderable extends VRenderable {
  constructor(ctx: RenderContext) {
    super(ctx, { visible: false, live: false, render: () => {} })
  }
}

/**
 * Host element tags understood by the renderer. They live in the reserved
 * `tui-` namespace so generic names (`box`, `text`, `select`) stay free for user
 * components; public component names (`<Box>`, `<Text>`) are layered on top.
 */
export type TuiElementTag =
  | 'tui-box'
  | 'tui-text'
  | 'tui-input'
  | 'tui-textarea'
  | 'tui-select'
  | 'tui-tab-select'
  | 'tui-markdown'
  | 'tui-scroll-box'

/**
 * Builds the Vue {@link RendererOptions} that translate Vue tree mutations into
 * OpenTUI `Renderable` tree mutations. A fresh set is created per app because
 * every `Renderable` needs the app's `RenderContext` (the `CliRenderer`), which
 * only exists after the renderer is created.
 *
 * @param ctx - the OpenTUI render context (a `CliRenderer` instance)
 */
export function createNodeOps(ctx: RenderContext): RendererOptions<BaseRenderable, Renderable> {
  // Make OpenTUI's key/mouse events DOM-shaped so Vue's `v-on` modifier guards
  // (`@keyDown.ctrl.c`, `@mouseDown.right`, …) work against them directly.
  installDomEventCompat()

  const makeAnchor = (): AnchorRenderable => new AnchorRenderable(ctx)

  // Text nodes (`TextNodeRenderable`) are only valid inside a `<tui-text>`. Vue,
  // however, creates Fragment boundary anchors as empty text nodes and inserts
  // them into whatever container holds the fragment — so `v-for`, multi-root
  // components and `<RouterView>` routinely place text nodes inside a `<tui-box>`,
  // where `Box.add` rejects them (they have no layout node). For those, we keep
  // an invisible layout anchor as a stand-in and map between the two so all tree
  // operations stay consistent. Per-app maps (this closure) avoid cross-app leaks.
  const anchorForText = new WeakMap<object, AnchorRenderable>()
  const textForAnchor = new WeakMap<object, TextNodeRenderable>()

  // The renderable actually present in the OpenTUI tree for a given Vue node.
  const treeNode = (node: BaseRenderable): BaseRenderable => anchorForText.get(node) ?? node
  // The Vue node corresponding to a renderable in the tree (inverse of above).
  const vueNode = (node: BaseRenderable): BaseRenderable => textForAnchor.get(node) ?? node

  // Realize (once) the layout anchor standing in for a text node in a layout parent.
  const layoutStandIn = (text: TextNodeRenderable): AnchorRenderable => {
    let anchor = anchorForText.get(text)
    if (!anchor) {
      anchor = makeAnchor()
      anchorForText.set(text, anchor)
      textForAnchor.set(anchor, text)
    }
    return anchor
  }

  // OpenTUI renders on demand and coalesces requests behind an internal
  // `updateScheduled` flag it only clears a microtask *after* the in-flight
  // frame finishes. Vue applies its mutations during an async flush (a
  // microtask); when a key handler also triggers an imperative render in the
  // same tick (e.g. `focus()`, which calls `requestRender` synchronously), that
  // frame is scheduled on `process.nextTick` and runs *before* Vue's flush,
  // leaving `updateScheduled` set across the whole flush. The `requestRender`
  // calls OpenTUI's own setters make for our mutations are then swallowed, and
  // the screen only catches up on the *next* render — the classic
  // one-keystroke-late bug (see the Sidebar arrow-nav demo).
  //
  // So in addition to whatever OpenTUI requests synchronously, schedule one
  // coalesced render per flush in a microtask. It runs after Vue's flush *and*
  // after OpenTUI clears `updateScheduled`, so the request always lands and the
  // tree's final state is painted in the same tick it changed.
  let renderQueued = false
  const scheduleRender = (): void => {
    if (renderQueued) return
    renderQueued = true
    queueMicrotask(() => {
      renderQueued = false
      ctx.requestRender()
    })
  }

  // WORKAROUND: OpenTUI setters don't treat `null`/`undefined` as "reset to
  // default" — they store it as-is or silently ignore it. When a prop is
  // unset, read the default off a throwaway pristine instance of the same
  // renderable class, cached so each (class, key) pays the construction once.
  const classDefaults = new Map<Function, Map<string, unknown>>()
  const defaultValue = (el: BaseRenderable, key: string): unknown => {
    let defaults = classDefaults.get(el.constructor)
    if (!defaults) {
      defaults = new Map()
      classDefaults.set(el.constructor, defaults)
    }
    // `has()`, not a nullish check: defaults are often `false` or `0`
    if (!defaults.has(key)) {
      const Ctor = el.constructor as new (ctx: RenderContext, options: object) => BaseRenderable
      // Markdown needs a `syntaxStyle` to construct meaningfully; reuse the
      // element's own (unsetting `syntaxStyle` itself is then a no-op).
      const pristine = new Ctor(
        ctx,
        el instanceof MarkdownRenderable ? { syntaxStyle: el.syntaxStyle } : {},
      )
      defaults.set(key, (pristine as unknown as Record<string, unknown>)[key])
      pristine.destroyRecursively()
    }
    return defaults.get(key)
  }

  return {
    createElement(tag, _namespace, _isCustomizedBuiltIn, props) {
      // NOTE: props are ignored here because Vue calls patchProp sync right
      // after — except for `<tui-markdown>`, whose renderable *requires* a
      // `syntaxStyle` at construction (it cannot be patched in later).
      switch (tag) {
        case 'tui-box':
          return new BoxRenderable(ctx, {})
        case 'tui-text':
          return new TextRenderable(ctx, {})
        case 'tui-input':
          return new InputRenderable(ctx, {})
        case 'tui-textarea':
          return new TextareaRenderable(ctx, {})
        case 'tui-select':
          return new SelectRenderable(ctx, {})
        case 'tui-tab-select':
          return new TabSelectRenderable(ctx, {})
        case 'tui-scroll-box':
          // `scrollX`/`scrollY` are constructor-only: they pick the content's
          // min/max size constraints and have no setters, so they must be read
          // here instead of riding the patchProp path. `undefined` keeps the
          // renderable's defaults (`scrollX: false`, `scrollY: true`).
          return new ScrollBoxRenderable(ctx, {
            scrollX: propToOptionalBoolean(props?.scrollX),
            scrollY: propToOptionalBoolean(props?.scrollY),
          })
        case 'tui-markdown': {
          // `MarkdownRenderable` requires a `syntaxStyle` up front, so read it
          // from the props here rather than deferring to patchProp. The
          // `<Markdown>` component declares it required; a bare `<tui-markdown>`
          // without one is a usage error we surface eagerly.
          const syntaxStyle = props?.syntaxStyle
          if (!syntaxStyle) {
            throw new Error(
              '[vue-termui] <Markdown> requires a `syntaxStyle` prop. Build one with `SyntaxStyle.fromStyles(...)`.',
            )
          }
          return new MarkdownRenderable(ctx, { syntaxStyle })
        }
        default:
          throw new Error(`[vue-termui] Unknown element type: <${tag}>`)
      }
    },

    // Inline text node (only used for array/interpolated text children and
    // Fragment anchors; a lone string child goes through `setElementText`).
    createText(text) {
      // not worth the optimization?
      // if (!text) return makeAnchor()
      return TextNodeRenderable.fromString(text)
    },

    // Comments act as invisible anchors for `v-if`/`v-for` placeholders.
    createComment() {
      return makeAnchor()
    },

    setText(node, text) {
      if (node instanceof TextNodeRenderable) {
        node.children = [text]
        scheduleRender()
      } else {
        console.warn(`[vue-termui] setText called on non-text node: ${node.constructor.name}`)
      }
    },

    setElementText(el, text) {
      if (el instanceof TextRenderable) {
        el.content = text
        scheduleRender()
      } else {
        console.warn(`[vue-termui] setElementText called on non-text node: ${el.constructor.name}`)
      }
    },

    insert(child, parent, anchor) {
      // detect nested Text to show a more comprehensive error
      if (
        process.env.NODE_ENV !== 'production' &&
        child instanceof TextRenderable &&
        parent instanceof TextRenderable
      ) {
        console.error(
          '[vue-termui] <Text> cannot be nested inside another <Text>; the nested one was ignored. ' +
            'Style part of a line with the `content` prop instead, e.g. ' +
            '`<Text :content="t`Press ${bold(\'q\')} to quit`" />`. ' +
            'See https://vue-termui.esm.dev/components/text',
        )
        return
      }

      // A text node inside a `<tui-text>` is real content; anywhere else it needs a
      // layout stand-in so OpenTUI can place it in the layout tree.
      const node =
        child instanceof TextNodeRenderable && !(parent instanceof TextRenderable)
          ? layoutStandIn(child)
          : child
      const before = anchor ? treeNode(anchor) : null
      if (before) {
        parent.insertBefore(node, before)
      } else {
        parent.add(node)
      }
      scheduleRender()
    },

    remove(child) {
      const node = treeNode(child)
      // remove is only called to the root component being destroyed
      // so we need to destroy the whole tree recursively
      node.destroyRecursively()
      scheduleRender()
    },

    parentNode(node) {
      return (treeNode(node).parent as Renderable | null) ?? null
    },

    nextSibling(node) {
      const current = treeNode(node)
      const parent = current.parent
      if (!parent) return null
      const children = parent.getChildren()
      const index = children.indexOf(current as Renderable)
      if (index < 0) return null
      const next = children[index + 1]
      return next ? (vueNode(next) as Renderable) : null
    },

    // Layout, ANSI and rendering are owned by OpenTUI; real prop mapping
    // (colors, borders, flex props) lands with the Box/Text components.
    patchProp(el, key, _prevValue, nextValue) {
      // Several listeners for one event (e.g. multiple `@keyDown.*` bindings)
      // arrive as an array, but a renderable holds a single handler per event —
      // collapse them into one dispatcher that runs each, like Vue's DOM
      // "invokers" do.
      const isEventHandler = /^on[A-Z]/.test(key)
      let value =
        Array.isArray(nextValue) && isEventHandler
          ? (...args: unknown[]): void => {
              for (const handler of nextValue) {
                if (typeof handler === 'function') handler(...args)
              }
            }
          : nextValue

      // Unsetting restores the class default. Event props skip it: they are
      // set-only accessors where nullish already means "remove the handler".
      if (!isEventHandler && value == null) {
        value = defaultValue(el, key)
      }

      ;(el as unknown as Record<string, unknown>)[key] = value
      scheduleRender()
    },
  }
}
