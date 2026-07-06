import {
  type TabSelectRenderable,
  TabSelectRenderableEvents,
  type TabSelectRenderableOptions,
  type TabSelectOption as Base_TabSelectOption,
} from '@opentui/core'
import {
  defineComponent,
  h,
  onMounted,
  type PropType,
  shallowRef,
  watch,
  type VNode,
} from '@vue/runtime-core'
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
 * A single tab in a {@link TabSelect}.
 */
export interface TabSelectOption extends Omit<Base_TabSelectOption, 'value'> {
  /**
   * Label shown on the tab.
   */
  name: string

  /**
   * Secondary text shown under the selected tab. Required — the renderable
   * always draws the selected tab's description.
   */
  description: string

  /**
   * Arbitrary value associated with the tab.
   */
  value?: unknown
}

/**
 * Props accepted by {@link TabSelect}. Extends OpenTUI's native
 * `TabSelectRenderable` options (`tabWidth`, `showDescription`, colors, …),
 * which fall through to the underlying renderable; the extra props below drive
 * `v-model` and focus, and `options` is narrowed to the local
 * {@link TabSelectOption} type.
 *
 * `options` is omitted from the native surface: it is managed here through the
 * `options` prop. There is no native `selectedIndex` option — the highlighted
 * tab is driven imperatively from `v-model` (see below).
 */
export interface TabSelectProps
  extends Omit<TabSelectRenderableOptions, 'options'>, RenderableEventProps {
  /**
   * The tabs to display.
   */
  options?: TabSelectOption[]

  /**
   * Index of the highlighted tab. Use with `v-model`.
   */
  modelValue?: number

  /**
   * Emitted when the user moves the highlight. Use with `v-model`.
   */
  'onUpdate:modelValue'?: (index: number) => void

  /**
   * Emitted when the user commits a tab (Enter), with the option and its index.
   */
  onSelect?: (option: TabSelectOption | null, index: number) => void
}

/**
 * A horizontal, tab-based single-choice control mapping to OpenTUI's
 * `TabSelectRenderable`. `v-model` binds the highlighted index; `select` fires
 * when the user commits a tab (Enter) with the option and its index. Navigate
 * with ←/→ while focused.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { TabSelect, ref } from 'vue-termui'
 * const index = ref(0)
 * const options = [
 *   { name: 'Home', description: 'Dashboard' },
 *   { name: 'Files', description: 'File management' },
 * ]
 * </script>
 * <template>
 *   <TabSelect v-model="index" :options="options" :width="60" autofocus @select="onPick" />
 * </template>
 * ```
 */
export const TabSelect: TuiComponent<TabSelectProps, TabSelectRenderable> = defineComponent({
  name: 'TabSelect',
  inheritAttrs: false,
  props: {
    options: Array as PropType<TabSelectOption[]>,
    modelValue: Number,
    ...renderableProps,
    // not to cast to boolean, kept optional so unset props preserve defaults
    showScrollArrows: null,
    showDescription: null,
    showUnderline: null,
    wrapSelection: null,
  },
  // for type safety and to avoid runtime warnings
  // but we rely on TabSelectProps declaration as onUpdate:modelValue for component-usage type safety
  emits: {
    'update:modelValue': (index: number) => typeof index === 'number',
    select: (_option: TabSelectOption | null, index: number) => typeof index === 'number',
    ...renderableEmits,
  } satisfies ExtractEventsNames<TabSelectProps, TabSelectRenderableOptions>,
  setup(props, { emit, attrs }) {
    const tabSelect = shallowRef<TabSelectRenderable | null>(null)

    onMounted(() => {
      const el = tabSelect.value
      if (!el) return

      // Unlike `SelectRenderable`, there is no `selectedIndex` option/setter, so
      // seed the initial highlight imperatively (the renderable defaults to 0).
      // Done before wiring the listener so this seed never bounces back out.
      // `setSelectedIndex` ignores out-of-range indices.
      if (props.modelValue != null) el.setSelectedIndex(props.modelValue)

      // Both events carry `(index, option)`. User navigation moves the highlight
      // and emits `selectionChanged`; mirror the new index back out through
      // `v-model`.
      el.on(TabSelectRenderableEvents.SELECTION_CHANGED, (index: number) => {
        if (index !== props.modelValue) emit('update:modelValue', index)
      })
      el.on(
        TabSelectRenderableEvents.ITEM_SELECTED,
        (index: number, option: TabSelectOption | null) => {
          emit('select', option, index)
        },
      )

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, { autofocus: props.autofocus })
    })

    // Sync outside-driven `v-model` changes into the renderable. `setSelectedIndex`
    // emits `selectionChanged`, but the guard above (and the equality check here)
    // stop it bouncing back through `update:modelValue`.
    watch(
      () => props.modelValue,
      (index) => {
        const el = tabSelect.value
        if (el && index != null && index !== el.getSelectedIndex()) {
          el.setSelectedIndex(index)
        }
      },
    )

    return (): VNode =>
      h('tab-select', {
        // native options and listeners (width, tabWidth, colors, keyBindings, …)
        ...attrs,
        // Coerce and forward each optional boolean only when set, so an unset
        // prop keeps the renderable's own default (see `optionalBooleanProps`).
        ...optionalBooleanProps(props, [
          'showScrollArrows',
          'showDescription',
          'showUnderline',
          'wrapSelection',
          'focusable',
        ]),
        // `options` rides the normal prop path: `patchProp` assigns it only when
        // it actually changes. The highlighted index is *not* a prop here — the
        // renderable has no `selectedIndex` setter, so it is driven through the
        // `watch` above via `setSelectedIndex()`.
        options: props.options,
        ref: tabSelect,
      })
  },
})
