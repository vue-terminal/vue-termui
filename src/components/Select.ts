import {
  type SelectRenderable,
  SelectRenderableEvents,
  type SelectRenderableOptions,
} from '@opentui/core'
import { type FunctionalComponent, h, type PropType, type VNodeRef } from '@vue/runtime-core'

/**
 * A single choice in a {@link Select}.
 */
export interface SelectOption {
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
export interface SelectProps extends Omit<SelectRenderableOptions, 'options' | 'selectedIndex'> {
  /**
   * The choices to display.
   */
  options?: SelectOption[]

  /**
   * Index of the highlighted option. Use with `v-model`.
   */
  modelValue?: number

  /**
   * Focus the list as soon as it mounts (so arrow keys navigate it).
   */
  focus?: boolean
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
 *   <Select v-model="index" :options="options" focus @select="onPick" />
 * </template>
 * ```
 */
type SelectEmits = {
  'update:modelValue': (index: number) => void
  select: (option: SelectOption | null, index: number) => void
}

// Event listeners (and the initial focus) are one-time, mount-shaped side
// effects, but a functional component has no lifecycle hooks. A function `ref`
// fills that gap: OpenTUI hands us the `SelectRenderable` when it mounts. The
// `WeakSet` guard makes wiring idempotent — Vue may invoke the ref again on
// updates, and re-attaching would duplicate the listeners.
const wired = new WeakSet<SelectRenderable>()

export const Select: FunctionalComponent<SelectProps, SelectEmits> = (props, { emit, attrs }) =>
  h('select', {
    // Native options (`showDescription`, `wrapSelection`, colors, …) fall
    // through as attributes: they only reach the renderable when actually set,
    // so unset props never overwrite the renderable's defaults.
    ...attrs,
    // `options` and the `selectedIndex` (driven by `v-model`) ride the normal
    // prop path: `patchProp` assigns them only when they actually change (Vue
    // skips unchanged props). Crucially, the `selectedIndex` *setter* is silent
    // (it does not emit `selectionChanged`, unlike `setSelectedIndex()`), so an
    // outside-driven change never bounces back through `update:modelValue`.
    options: props.options,
    selectedIndex: props.modelValue,
    ref: ((select: SelectRenderable | null) => {
      if (!select || wired.has(select)) return
      wired.add(select)

      // User navigation moves the highlight and emits `selectionChanged`; mirror
      // it back out through `v-model`.
      select.on(SelectRenderableEvents.SELECTION_CHANGED, () => {
        const index = select.getSelectedIndex()
        if (index !== props.modelValue) emit('update:modelValue', index)
      })
      select.on(SelectRenderableEvents.ITEM_SELECTED, () => {
        emit('select', select.getSelectedOption() as SelectOption | null, select.getSelectedIndex())
      })

      if (props.focus) select.focus()
    }) as VNodeRef,
  })

Select.displayName = 'Select'
// Runtime prop declaration so `options`/`modelValue`/`focus` are extracted
// instead of falling through as attributes onto the host `<select>` element.
Select.props = {
  options: { type: Array as PropType<SelectOption[]>, default: () => [] },
  modelValue: { type: Number, default: 0 },
  focus: Boolean,
}
Select.emits = {
  'update:modelValue': (index: number) => typeof index === 'number',
  select: (_option: SelectOption | null, index: number) => typeof index === 'number',
}
