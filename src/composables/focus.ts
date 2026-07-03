import { type CliRenderer, type Renderable } from '@opentui/core'
import { inject, type ShallowRef, shallowRef } from '@vue/runtime-core'
import { useRenderer } from '../renderer/index'

// TODO: measure how slow this can be and improve performance with some dirty checking
/**
 * Collect every focusable, visible, live renderable under `node`, in
 * depth-first tree order (which is the natural Tab order).
 */
function collectFocusables(node: Renderable, out: Renderable[] = []): Renderable[] {
  for (const child of node.getChildren()) {
    if (child.focusable && child.visible && !child.isDestroyed) {
      out.push(child)
    }
    collectFocusables(child, out)
  }
  return out
}

/**
 * Move focus to the next (`step: 1`) or previous (`step: -1`) focusable element
 * in tree order, wrapping around. With nothing focused, `1` starts at the first
 * element and `-1` at the last. No-op when there are no focusables.
 *
 * The list is rebuilt on every call so it always reflects the current tree —
 * pages that mount/unmount focusable widgets are handled without bookkeeping.
 */
function moveFocus(renderer: CliRenderer, step: 1 | -1): void {
  const focusables = collectFocusables(renderer.root)
  const count = focusables.length
  if (!count) return
  const current = renderer.currentFocusedRenderable
  const index = current ? focusables.indexOf(current) : -1
  const next =
    index < 0 ? focusables[step > 0 ? 0 : count - 1]! : focusables[(index + step + count) % count]!
  // Call the renderable's own `focus()`, not `renderer.focusRenderable()`: the
  // latter only moves the `currentFocusedRenderable` pointer (and blurs the
  // previous element) without marking `next` focused or registering its key
  // handler, so it would receive no keystrokes. `focus()` does both.
  next.focus()
}

/**
 * Return value of {@link useFocusManager}.
 */
export interface UseFocusManagerReturn {
  /**
   * The currently focused element, or `null`. Reactive.
   * Same as {@link useCurrentFocusedElement}.
   */
  focused: ShallowRef<Renderable | null>

  /**
   * Focus the next focusable element in tree order, wrapping around. With
   * nothing focused, focuses the first. No-op when nothing is focusable.
   */
  focusNext(): void

  /**
   * Focus the previous focusable element in tree order, wrapping around. With
   * nothing focused, focuses the last. No-op when nothing is focusable.
   */
  focusPrevious(): void

  /**
   * Clear focus from whatever element currently has it.
   */
  blur(): void
}

/**
 * App-level focus management that can be used to implement Tab navigation.
 *
 * Elements opt in (or out) with their `focusable` prop. Interactive ones like
 * `Input` already are. Mark others like `<Box :focusable="true" />`. The order
 * is the render tree's depth-first order.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { onKeyDown, useFocusManager } from 'vue-termui'
 * const { focusNext, focusPrevious } = useFocusManager()
 * onKeyDown((key) => {
 *   if (key.name !== 'tab') return
 *   key.preventDefault()
 *   key.shift ? focusPrevious() : focusNext()
 * })
 * </script>
 * ```
 */
export function useFocusManager(): UseFocusManagerReturn {
  const renderer = useRenderer()

  return {
    focused: useCurrentFocusedElement(),
    focusNext: () => moveFocus(renderer, 1),
    focusPrevious: () => moveFocus(renderer, -1),
    blur: () => renderer.currentFocusedRenderable?.blur(),
  }
}

/**
 * Injection key for the app-level current-focused element ref.
 * @internal
 */
export const USE_CURRENT_FOCUSED_ELEMENT_KEY: unique symbol = Symbol('useCurrentFocused')

/**
 * Reactive currently focused element, or `null` when nothing is focused.
 */
export function useCurrentFocusedElement(): ShallowRef<Renderable | null> {
  // Fall back to a standalone ref when no app-level provider exists — e.g. a
  // `Box` rendered through a bare renderer in tests. Focus tracking is inert in
  // that case, but the component still renders instead of throwing on a missing
  // injection. `createTuiApp` provides the real, renderer-backed ref.
  return inject(USE_CURRENT_FOCUSED_ELEMENT_KEY, null) ?? shallowRef<Renderable | null>(null)
}
