import { CliRenderEvents, type CliRenderer, type Renderable } from '@opentui/core'
import { inject, type Ref, ref, type ShallowRef, shallowRef, watch } from '@vue/runtime-core'
import { useRenderer } from '../renderer/index'
import { useRendererEvent } from './useRendererEvent'

/**
 * Options for {@link useFocus}.
 */
export interface UseFocusOptions {
  /**
   * Focus the element as soon as it mounts.
   *
   * @default false
   */
  autoFocus?: boolean
}

/**
 * A function template ref — bind it with `:ref` / `ref:`. The parameter is
 * `unknown` (rather than `Renderable`) so it stays assignable to Vue's
 * DOM-oriented `VNodeRef` type when used in render functions.
 */
export type ElementRef = (el: unknown) => void

/**
 * Return value of {@link useFocus}.
 */
export interface UseFocusReturn {
  /**
   * Template ref to bind to the element you want focusable:
   * `<Box :ref="focusRef" />`. Once mounted the element is marked focusable.
   *
   * It's a **function ref** on purpose: `<script setup>` unwraps a destructured
   * `ref` object in `:ref="..."` (compiling to `ref: theRef.value`, i.e. `null`),
   * so a plain ref returned from a composable never binds. A function is passed
   * through untouched and works in both SFC templates and render functions.
   */
  ref: ElementRef

  /**
   * The focusable element once mounted (read-only; for advanced use).
   */
  element: ShallowRef<Renderable | null>

  /**
   * Whether this element currently holds focus.
   */
  focused: Ref<boolean>

  /**
   * Give this element focus.
   */
  focus(): void

  /**
   * Remove focus from this element.
   */
  blur(): void
}

/**
 * Makes a single element focusable and tracks/controls its focus state. Bind
 * the returned `ref` to the element, then read `focused` or call `focus()` /
 * `blur()`. OpenTUI owns focus routing (the focused element receives key
 * events); this is a thin reactive wrapper over it.
 *
 * OpenTUI does not cycle focus on Tab for you — wire Tab to `focus()` across
 * your elements (see {@link useFocusManager}).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFocus } from 'vue-termui'
 * const { ref: inputRef, focused } = useFocus({ autoFocus: true })
 * </script>
 * <template><Box :ref="inputRef" :borderColor="focused ? 'blue' : 'gray'" /></template>
 * ```
 */
export function useFocus(options: UseFocusOptions = {}): UseFocusReturn {
  const renderer = useRenderer()
  const element = shallowRef<Renderable | null>(null)
  const focused = ref(false)

  const sync = (): void => {
    focused.value = !!element.value && renderer.currentFocusedRenderable === element.value
  }

  watch(element, (el) => {
    if (!el) return
    el.focusable = true
    sync()
    if (options.autoFocus) el.focus()
  })

  useRendererEvent(CliRenderEvents.FOCUSED_RENDERABLE, sync)

  return {
    ref: (el) => {
      // Bound to a component (e.g. `<Box :ref="...">`) the ref receives that
      // component's public instance, whose `$el` is the backing renderable;
      // bound to a host element it receives the renderable directly. Unwrap
      // `$el` so both bindings resolve to the renderable.
      const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: unknown }).$el : el
      element.value = (node as Renderable | null) ?? null
    },
    element,
    focused,
    focus: () => element.value?.focus(),
    blur: () => element.value?.blur(),
  }
}

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
 * App-level Tab navigation over OpenTUI's focus system: a reactive `focused`
 * element plus `focusNext()` / `focusPrevious()` that cycle through every
 * focusable element in tree order (wrapping), and `blur()` to clear focus.
 *
 * Elements opt in by being `focusable` (interactive ones like `Input` already
 * are; mark a container with `<Box :focusable="true" />` or {@link useFocus}).
 * The order is the render tree's depth-first order.
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
  const focused = shallowRef<Renderable | null>(renderer.currentFocusedRenderable)

  useRendererEvent(CliRenderEvents.FOCUSED_RENDERABLE, () => {
    focused.value = renderer.currentFocusedRenderable
  })

  return {
    focused,
    focusNext: () => moveFocus(renderer, 1),
    focusPrevious: () => moveFocus(renderer, -1),
    blur: () => renderer.currentFocusedRenderable?.blur(),
  }
}

export const USE_CURRENT_FOCUSED_ELEMENT_KEY: unique symbol = Symbol('useCurrentFocused')

export function useCurrentFocusedElement(): ShallowRef<Renderable | null> {
  // Fall back to a standalone ref when no app-level provider exists — e.g. a
  // `Box` rendered through a bare renderer in tests. Focus tracking is inert in
  // that case, but the component still renders instead of throwing on a missing
  // injection. `createTuiApp` provides the real, renderer-backed ref.
  return inject(USE_CURRENT_FOCUSED_ELEMENT_KEY, null) ?? shallowRef<Renderable | null>(null)
}
