import {
  type SelectRenderable,
  SelectRenderableEvents,
  type SelectRenderableOptions,
  type SelectOption as Base_SelectOption,
} from '@opentui/core'
import {
  defineComponent,
  h,
  onMounted,
  type PropType,
  shallowRef,
  type VNode,
} from '@vue/runtime-core'
import {
  type ExtractEventsNames,
  optionalBooleanProps,
  type RenderableEventProps,
  renderableEmits,
  setupRenderableEvents,
  type TuiComponent,
} from './utils'

/**
 * A single choice in a {@link Select}.
 */
export interface SelectOption extends Omit<Base_SelectOption, 'value' | 'description'> {
  /**
   * Label shown for the option.
   */
  name: string

  /**
   * Secondary text shown alongside the name.
   */
  description?: string

  /**
   * Arbitrary value associated with the option.
   */
  value?: unknown
}

/**
 * Props accepted by {@link Select}. Extends OpenTUI's native `SelectRenderable`
 * options (`showDescription`, `wrapSelection`, colors, …), which fall through
 * to the underlying renderable; the extra props below drive `v-model` and
 * focus, and `options` is narrowed to the local {@link SelectOption} type.
 *
 * `options` and `selectedIndex` are omitted from the native surface: they are
 * managed here through `options` and `v-model` respectively.
 */
export interface SelectProps
  extends Omit<SelectRenderableOptions, 'options' | 'selectedIndex'>, RenderableEventProps {
  /**
   * The choices to display.
   */
  options?: SelectOption[]

  /**
   * Index of the highlighted option. Use with `v-model`.
   */
  modelValue?: number

  /**
   * Emitted when the user moves the highlight. Use with `v-model`.
   */
  'onUpdate:modelValue'?: (index: number) => void

  /**
   * Emitted when the user commits a choice (Enter), with the option and its
   * index.
   */
  onSelect?: (option: SelectOption | null, index: number) => void
}

/**
 * A scrollable single-choice list mapping to OpenTUI's `SelectRenderable`.
 * `v-model` binds the highlighted index; `select` fires when the user commits a
 * choice (Enter) with the option and its index.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Select, ref } from 'vue-termui'
 * const index = ref(0)
 * const options = [{ name: 'One' }, { name: 'Two' }]
 * </script>
 * <template>
 *   <Select v-model="index" :options="options" autofocus @select="onPick" />
 * </template>
 * ```
 */
export const Select: TuiComponent<SelectProps, SelectRenderable> = defineComponent({
  name: 'Select',
  props: {
    options: Array as PropType<SelectOption[]>,
    modelValue: Number,
    autofocus: Boolean,
    // not to cast to boolean, kept optional so unset props preserve defaults
    showDescription: null,
    showScrollIndicator: null,
    wrapSelection: null,
    focusable: null,
  },
  // for type safety and to avoid runtime warnings
  // but we rely on SelectProps declaration as onUpdate:modelValue for component-usage type safety
  emits: {
    'update:modelValue': (index: number) => typeof index === 'number',
    select: (_option: SelectOption | null, index: number) => typeof index === 'number',
    ...renderableEmits,
  } satisfies ExtractEventsNames<SelectProps, SelectRenderableOptions>,
  setup(props, { emit, attrs }) {
    const select = shallowRef<SelectRenderable | null>(null)

    onMounted(() => {
      const el = select.value
      if (!el) return

      // Both events carry `(index, option)` — use that payload directly rather
      // than re-querying the renderable. User navigation moves the highlight and
      // emits `selectionChanged`; mirror the new index back out through `v-model`.
      el.on(SelectRenderableEvents.SELECTION_CHANGED, (index: number) => {
        if (index !== props.modelValue) emit('update:modelValue', index)
      })
      el.on(SelectRenderableEvents.ITEM_SELECTED, (index: number, option: SelectOption | null) => {
        emit('select', option, index)
      })

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, { autofocus: props.autofocus })
    })

    return (): VNode =>
      h('select', {
        // native options and listeners
        ...attrs,
        // Coerce and forward each optional boolean only when set, so an unset
        // prop keeps the renderable's own default (see `optionalBooleanProps`).
        ...optionalBooleanProps(props, [
          'showDescription',
          'showScrollIndicator',
          'wrapSelection',
          'focusable',
        ]),
        // `options` and the `selectedIndex` (driven by `v-model`) ride the normal
        // prop path: `patchProp` assigns them only when they actually change (Vue
        // skips unchanged props). Crucially, the `selectedIndex` *setter* is silent
        // (it does not emit `selectionChanged`, unlike `setSelectedIndex()`), so an
        // outside-driven change never bounces back through `update:modelValue`.
        options: props.options,
        selectedIndex: props.modelValue,
        ref: select,
      })
  },
})
