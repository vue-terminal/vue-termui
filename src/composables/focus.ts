import { CliRenderEvents } from '@opentui/core'
import {
  getCurrentScope,
  onScopeDispose,
  type Ref,
  ref,
  type ShallowRef,
  shallowRef,
  watch,
} from '@vue/runtime-core'
import { useRenderer } from '../renderer/index'
import type { Renderable } from '@opentui/core'

/** Options for {@link useFocus}. */
export interface UseFocusOptions {
  /** Focus the element as soon as it mounts. @default false */
  autoFocus?: boolean
}

/**
 * A function template ref — bind it with `:ref` / `ref:`. The parameter is
 * `unknown` (rather than `Renderable`) so it stays assignable to Vue's
 * DOM-oriented `VNodeRef` type when used in render functions.
 */
export type ElementRef = (el: unknown) => void

/** Return value of {@link useFocus}. */
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
  /** The focusable element once mounted (read-only; for advanced use). */
  element: ShallowRef<Renderable | null>
  /** Whether this element currently holds focus. */
  focused: Ref<boolean>
  /** Give this element focus. */
  focus(): void
  /** Remove focus from this element. */
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

  watch(element, (el) => {
    if (!el) return
    el.focusable = true
    focused.value = renderer.currentFocusedRenderable === el
    if (options.autoFocus) el.focus()
  })

  const sync = (): void => {
    focused.value = !!element.value && renderer.currentFocusedRenderable === element.value
  }
  renderer.on(CliRenderEvents.FOCUSED_RENDERABLE, sync)
  if (getCurrentScope()) {
    onScopeDispose(() => renderer.off(CliRenderEvents.FOCUSED_RENDERABLE, sync))
  }

  return {
    ref: (el) => {
      element.value = (el as Renderable | null) ?? null
    },
    element,
    focused,
    focus: () => element.value?.focus(),
    blur: () => element.value?.blur(),
  }
}

/** Return value of {@link useFocusManager}. */
export interface UseFocusManagerReturn {
  /** The currently focused element, or `null`. Reactive. */
  focused: ShallowRef<Renderable | null>
  /** Focus an element. */
  focus(renderable: Renderable): void
  /** Clear focus from whatever element currently has it. */
  blur(): void
}

/**
 * App-level view of focus: the currently focused element (reactive) plus
 * imperative `focus()` / `blur()`. Use it to build Tab navigation by keeping
 * your own ordered list of elements and focusing the next on Tab.
 */
export function useFocusManager(): UseFocusManagerReturn {
  const renderer = useRenderer()
  const focused = shallowRef<Renderable | null>(renderer.currentFocusedRenderable)

  const sync = (): void => {
    focused.value = renderer.currentFocusedRenderable
  }
  renderer.on(CliRenderEvents.FOCUSED_RENDERABLE, sync)
  if (getCurrentScope()) {
    onScopeDispose(() => renderer.off(CliRenderEvents.FOCUSED_RENDERABLE, sync))
  }

  return {
    focused,
    focus: (renderable) => renderer.focusRenderable(renderable),
    blur: () => renderer.currentFocusedRenderable?.blur(),
  }
}
