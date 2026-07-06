import type { ScrollBoxOptions, ScrollBoxRenderable } from '@opentui/core'
import { defineComponent, h, onMounted, shallowRef, type VNode } from '@vue/runtime-core'
import {
  type ExtractEventsNames,
  optionalBooleanProps,
  type RenderableEventProps,
  renderableEmits,
  renderableProps,
  setupRenderableEvents,
  type TuiComponent,
} from './utils'

/**
 * Props accepted by {@link ScrollBox}. Extends OpenTUI's native
 * `ScrollBoxOptions` (all `Box` layout props plus `stickyScroll`,
 * `viewportCulling`, `scrollbarOptions`, …), which fall through to the
 * underlying renderable.
 *
 * `scrollX`/`scrollY` are redeclared because OpenTUI only reads them at
 * construction time (they fix the content's min/max size constraints and have
 * no setters), so they are **not reactive** — remount with a `:key` to change
 * them.
 */
export interface ScrollBoxProps
  extends Omit<ScrollBoxOptions, 'scrollX' | 'scrollY'>, RenderableEventProps {
  /**
   * Enable horizontal scrolling. Not reactive (constructor-only in OpenTUI).
   *
   * @default false
   */
  scrollX?: boolean

  /**
   * Enable vertical scrolling. Not reactive (constructor-only in OpenTUI).
   *
   * @default true
   */
  scrollY?: boolean
}

/**
 * A scrollable container mapping to OpenTUI's `ScrollBoxRenderable`. Children
 * overflow into a scrollable content area with automatic scrollbars. Focus it
 * (it is focusable by default) to scroll with the keyboard: arrows/`hjkl` by
 * line, PageUp/PageDown by half page, Home/End to the edges; the mouse wheel
 * works too. Reach the scroll API (`scrollTo`, `scrollBy`,
 * `scrollChildIntoView`, `scrollTop`, …) through the instance's `$el`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ScrollBox, Text, useTemplateRef } from 'vue-termui'
 * const scroller = useTemplateRef('scroller')
 * function toTop() {
 *   scroller.value?.$el.scrollTo(0)
 * }
 * </script>
 * <template>
 *   <ScrollBox ref="scroller" :height="10" stickyScroll stickyStart="bottom">
 *     <Text v-for="line in lines" :key="line">{{ line }}</Text>
 *   </ScrollBox>
 * </template>
 * ```
 */
export const ScrollBox: TuiComponent<ScrollBoxProps, ScrollBoxRenderable> = defineComponent({
  name: 'ScrollBox',
  inheritAttrs: false,
  props: {
    ...renderableProps,
    // not cast to boolean, kept optional so unset props preserve defaults
    scrollX: null,
    scrollY: null,
    stickyScroll: null,
    viewportCulling: null,
  },
  emits: {
    ...renderableEmits,
  } satisfies ExtractEventsNames<ScrollBoxProps, ScrollBoxOptions>,
  setup(props, { emit, attrs, slots }) {
    const scrollBox = shallowRef<ScrollBoxRenderable | null>(null)

    onMounted(() => {
      const el = scrollBox.value
      if (!el) return

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, props)
    })

    return (): VNode =>
      h(
        'scroll-box',
        {
          // native options and listeners
          ...attrs,
          // Coerce and forward each optional boolean only when set, so an unset
          // prop keeps the renderable's own default (see `optionalBooleanProps`).
          // `scrollX`/`scrollY` are consumed by `createElement`, not patched in.
          ...optionalBooleanProps(props, [
            'scrollX',
            'scrollY',
            'stickyScroll',
            'viewportCulling',
            'focusable',
          ]),
          ref: scrollBox,
        },
        slots.default?.(),
      )
  },
})
