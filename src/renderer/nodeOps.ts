import {
  type BaseRenderable,
  BoxRenderable,
  type Renderable,
  type RenderContext,
  TextNodeRenderable,
  TextRenderable,
} from '@opentui/core'
import type { RendererOptions } from '@vue/runtime-core'

/**
 * Host element tags understood by the renderer. These are intentionally
 * lowercase and internal; public component names are layered on top.
 */
export type TuiElementTag = 'box' | 'text'

/**
 * Builds the Vue {@link RendererOptions} that translate Vue tree mutations into
 * OpenTUI `Renderable` tree mutations. A fresh set is created per app because
 * every `Renderable` needs the app's `RenderContext` (the `CliRenderer`), which
 * only exists after the renderer is created.
 *
 * @param ctx - the OpenTUI render context (a `CliRenderer` instance)
 */
export function createNodeOps(ctx: RenderContext): RendererOptions<BaseRenderable, Renderable> {
  return {
    createElement(tag) {
      switch (tag) {
        case 'box':
          return new BoxRenderable(ctx, {})
        case 'text':
          return new TextRenderable(ctx, {})
        default:
          throw new Error(`[vue-termui] Unknown element type: <${tag}>`)
      }
    },

    // Inline text node (only used for array/interpolated text children; a lone
    // string child goes through the `setElementText` fast path instead).
    createText(text) {
      return TextNodeRenderable.fromString(text)
    },

    // Comments act as invisible anchors for `v-if`/`v-for` placeholders.
    createComment() {
      const anchor = new BoxRenderable(ctx, {})
      anchor.visible = false
      return anchor
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
      if (anchor) {
        parent.insertBefore(child, anchor)
      } else {
        parent.add(child)
      }
    },

    remove(child) {
      child.parent?.remove(child.id)
    },

    parentNode(node) {
      return (node.parent as Renderable | null) ?? null
    },

    nextSibling(node) {
      const parent = node.parent
      if (!parent) return null
      const children = parent.getChildren()
      const index = children.indexOf(node)
      if (index < 0) return null
      return children[index + 1] ?? null
    },

    // Layout, ANSI and rendering are owned by OpenTUI; real prop mapping
    // (colors, borders, flex props) lands with the Box/Text components.
    patchProp(el, key, _prevValue, nextValue) {
      ;(el as unknown as Record<string, unknown>)[key] = nextValue
    },
  }
}
