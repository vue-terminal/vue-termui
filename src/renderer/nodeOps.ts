import {
  type BaseRenderable,
  BoxRenderable,
  InputRenderable,
  type Renderable,
  type RenderContext,
  SelectRenderable,
  TextNodeRenderable,
  TextRenderable,
} from '@opentui/core'
import type { RendererOptions } from '@vue/runtime-core'

/**
 * Host element tags understood by the renderer. These are intentionally
 * lowercase and internal; public component names are layered on top.
 */
export type TuiElementTag = 'box' | 'text' | 'input' | 'select'

/**
 * Builds the Vue {@link RendererOptions} that translate Vue tree mutations into
 * OpenTUI `Renderable` tree mutations. A fresh set is created per app because
 * every `Renderable` needs the app's `RenderContext` (the `CliRenderer`), which
 * only exists after the renderer is created.
 *
 * @param ctx - the OpenTUI render context (a `CliRenderer` instance)
 */
export function createNodeOps(ctx: RenderContext): RendererOptions<BaseRenderable, Renderable> {
  // An invisible, out-of-flow placeholder used for comment nodes and as a
  // stand-in for text nodes that land in a layout container (see below).
  const makeAnchor = (): BoxRenderable => {
    const anchor = new BoxRenderable(ctx, { position: 'absolute' })
    anchor.visible = false
    return anchor
  }

  // Text nodes (`TextNodeRenderable`) are only valid inside a `<text>`. Vue,
  // however, creates Fragment boundary anchors as empty text nodes and inserts
  // them into whatever container holds the fragment — so `v-for`, multi-root
  // components and `<RouterView>` routinely place text nodes inside a `<box>`,
  // where `Box.add` rejects them (they have no layout node). For those, we keep
  // an invisible layout anchor as a stand-in and map between the two so all tree
  // operations stay consistent. Per-app maps (this closure) avoid cross-app leaks.
  const anchorForText = new WeakMap<object, BoxRenderable>()
  const textForAnchor = new WeakMap<object, TextNodeRenderable>()

  // The renderable actually present in the OpenTUI tree for a given Vue node.
  const treeNode = (node: BaseRenderable): BaseRenderable => anchorForText.get(node) ?? node
  // The Vue node corresponding to a renderable in the tree (inverse of above).
  const vueNode = (node: BaseRenderable): BaseRenderable => textForAnchor.get(node) ?? node

  // Realize (once) the layout anchor standing in for a text node in a layout parent.
  const layoutStandIn = (text: TextNodeRenderable): BoxRenderable => {
    let anchor = anchorForText.get(text)
    if (!anchor) {
      anchor = makeAnchor()
      anchorForText.set(text, anchor)
      textForAnchor.set(anchor, text)
    }
    return anchor
  }

  return {
    createElement(tag) {
      switch (tag) {
        case 'box':
          return new BoxRenderable(ctx, {})
        case 'text':
          return new TextRenderable(ctx, {})
        case 'input':
          return new InputRenderable(ctx, {})
        case 'select':
          return new SelectRenderable(ctx, {})
        default:
          throw new Error(`[vue-termui] Unknown element type: <${tag}>`)
      }
    },

    // Inline text node (only used for array/interpolated text children and
    // Fragment anchors; a lone string child goes through `setElementText`).
    createText(text) {
      return TextNodeRenderable.fromString(text)
    },

    // Comments act as invisible anchors for `v-if`/`v-for` placeholders.
    createComment() {
      return makeAnchor()
    },

    setText(node, text) {
      if (node instanceof TextNodeRenderable) {
        node.children = [text]
        node.requestRender()
      }
    },

    setElementText(el, text) {
      if (el instanceof TextRenderable) {
        el.content = text
      }
    },

    insert(child, parent, anchor) {
      // A text node inside a `<text>` is real content; anywhere else it needs a
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
    },

    remove(child) {
      const node = treeNode(child)
      node.parent?.remove(node.id)
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
      ;(el as unknown as Record<string, unknown>)[key] = nextValue
    },
  }
}
