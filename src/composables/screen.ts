import {
  type MaybeRefOrGetter,
  onScopeDispose,
  type Ref,
  ref,
  toValue,
  watch,
} from '@vue/runtime-core'
import { CliRenderEvents } from '@opentui/core'
import { useRenderer } from '../renderer/index'
import type { RemoveListener } from './keyboard'
import { useRendererEvent } from './useRendererEvent'

/**
 * Runs `handler` whenever the terminal is resized, with the new dimensions. The
 * listener is removed automatically when the calling component unmounts; the
 * returned function removes it early.
 */
export function onResize(handler: (width: number, height: number) => void): RemoveListener {
  const renderer = useRenderer()
  // Read the live dimensions off the renderer rather than relying on the event
  // payload, so the handler always sees the authoritative size.
  return useRendererEvent(CliRenderEvents.RESIZE, () => handler(renderer.width, renderer.height))
}

/** Reactive terminal dimensions returned by {@link useTerminalSize}. */
export interface TerminalSize {
  width: Ref<number>
  height: Ref<number>
}

/**
 * Reactive terminal size. The refs start at the current dimensions and update
 * on every resize.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useTerminalSize } from 'vue-termui'
 * const { width, height } = useTerminalSize()
 * </script>
 * <template><Text>{{ width }}×{{ height }}</Text></template>
 * ```
 */
export function useTerminalSize(): TerminalSize {
  const renderer = useRenderer()
  const width = ref(renderer.width)
  const height = ref(renderer.height)
  onResize((w, h) => {
    width.value = w
    height.value = h
  })
  return { width, height }
}

/**
 * Sets the terminal window/tab title to `title`, reactively. Accepts a string,
 * ref or getter; the title is reset to empty when the component unmounts.
 */
export function useTitle(title: MaybeRefOrGetter<string>): void {
  const renderer = useRenderer()
  watch(
    () => toValue(title),
    (value) => renderer.setTerminalTitle(value),
    {
      immediate: true,
    },
  )
  onScopeDispose(() => renderer.setTerminalTitle(''), true)
}
