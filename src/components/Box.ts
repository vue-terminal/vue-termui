import { type BoxRenderable, type BoxOptions } from '@opentui/core'
import { computed, defineComponent, h, onMounted, shallowRef, type VNode } from '@vue/runtime-core'
import {
  type RenderableEventProps,
  renderableEmits,
  renderableProps,
  setupRenderableEvents,
  type TuiComponent,
  optionalBooleanProps,
  optionalProp,
  resolveEventListeners,
} from './utils'
import { useCurrentFocusedElement } from '../composables/focus'

/**
 * Props accepted by {@link Box}. These are OpenTUI's native `BoxRenderable`
 * options (layout is real flexbox, handled natively) and are forwarded as-is
 * to the underlying renderable.
 */
export interface BoxProps extends BoxOptions, RenderableEventProps {}

/**
 * A flexbox container — the terminal equivalent of a `<div>`. Maps to OpenTUI's
 * `BoxRenderable`, which owns layout (real flexbox), borders, padding/margin and
 * background natively, so {@link BoxProps} are forwarded to it unchanged.
 *
 * Children go in the default slot.
 *
 * @example
 * ```vue
 * <Box border borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
 *   <Text bold>Title</Text>
 *   <Text>Body</Text>
 * </Box>
 * ```
 */
export const Box: TuiComponent<BoxProps, BoxRenderable> = defineComponent({
  name: 'Box',
  inheritAttrs: false,
  props: {
    ...renderableProps,
  },
  emits: {
    ...renderableEmits,
  },
  setup(props, { slots, emit, attrs }) {
    const box = shallowRef<BoxRenderable | null>(null)
    const currentFocusedElement = useCurrentFocusedElement()
    const isDescendantFocused = computed(
      () => currentFocusedElement.value && box.value?.hasFocusedDescendant,
    )

    onMounted(() => {
      const el = box.value
      if (!el) return

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, props)
    })

    return (): VNode =>
      h(
        'box',
        {
          // Fold event-modifier bindings (`@keyDown.ctrl.c`) into plain
          // renderable listeners before they reach the host element.
          ...resolveEventListeners(attrs),
          /*
           * OpenTUI only applies focusedBorderColor if the box is focusable,
           * but that makes it accessible by Tab navigation, which is usually
           * not what we want, so instead we handle the change locally. Omit the
           * key entirely when neither color is set, so we don't clobber the
           * renderable's default with `undefined`.
           */
          ...optionalProp(
            'borderColor',
            (isDescendantFocused.value ? attrs.focusedBorderColor : null) ?? attrs.borderColor,
          ),
          ...optionalBooleanProps(props, ['autofocus', 'focusable']),
          ref: box,
        },
        slots.default?.(),
      )
  },
})
