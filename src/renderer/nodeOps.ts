import {
  type BaseRenderable,
  VRenderable,
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
  const makeAnchor = (): AnchorRenderable => new AnchorRenderable(ctx)

  // Text nodes (`TextNodeRenderable`) are only valid inside a `<text>`. Vue,
  // however, creates Fragment boundary anchors as empty text nodes and inserts
  // them into whatever container holds the fragment — so `v-for`, multi-root
  // components and `<RouterView>` routinely place text nodes inside a `<box>`,
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

  /*
   * NOTE: setting props, adding, removing, etc all requestRender() on the affected renderable, which schedules a render pass.
   */

  return {
    createElement(tag, _namespace, _isCustomizedBuiltIn, _props) {
      // NOTE: we don't pass the props because Vue calls patchProp sync anyway
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
      } else {
        console.warn(`[vue-termui] setText called on non-text node: ${node.constructor.name}`)
      }
    },

    setElementText(el, text) {
      if (el instanceof TextRenderable) {
        el.content = text
      } else {
        console.warn(`[vue-termui] setElementText called on non-text node: ${el.constructor.name}`)
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
