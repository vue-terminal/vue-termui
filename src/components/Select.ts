import { SelectRenderable, SelectRenderableEvents } from '@opentui/core'
import {
  type DefineComponent,
  defineComponent,
  h,
  onMounted,
  type PropType,
  shallowRef,
  watch,
} from '@vue/runtime-core'
/** A single choice in a {@link Select}. */
export interface SelectOption {
  /** Label shown for the option. */
  name: string
  /** Secondary text shown alongside the name. */
  description?: string
  /** Arbitrary value associated with the option. */
  value?: unknown
}

/** Props accepted by {@link Select}. */
export interface SelectProps {
  /** The choices to display. */
  options?: SelectOption[]
  /** Index of the highlighted option. Use with `v-model`. */
  modelValue?: number
  /** Focus the list as soon as it mounts (so arrow keys navigate it). */
  focus?: boolean
  /** Show each option's description. */
  showDescription?: boolean
  /** Wrap around when navigating past the ends. */
  wrapSelection?: boolean
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
export const Select = defineComponent({
  name: 'Select',

  props: {
    options: { type: Array as PropType<SelectOption[]>, default: () => [] },
    modelValue: { type: Number, default: 0 },
    focus: Boolean,
    showDescription: { type: Boolean, default: undefined },
    wrapSelection: { type: Boolean, default: undefined },
  },

  emits: {
    'update:modelValue': (index: number) => typeof index === 'number',
    select: (option: SelectOption | null, index: number) => typeof index === 'number',
  },

  setup(props, { emit }) {
    const el = shallowRef<SelectRenderable | null>(null)

    onMounted(() => {
      const select = el.value
      if (!select) return

      select.options = props.options as never
      if (props.modelValue !== select.getSelectedIndex()) {
        select.setSelectedIndex(props.modelValue ?? 0)
      }

      select.on(SelectRenderableEvents.SELECTION_CHANGED, () => {
        const index = select.getSelectedIndex()
        if (index !== props.modelValue) emit('update:modelValue', index)
      })
      select.on(SelectRenderableEvents.ITEM_SELECTED, () => {
        emit('select', select.getSelectedOption() as SelectOption | null, select.getSelectedIndex())
      })

      if (props.focus) select.focus()
    })

    watch(
      () => props.modelValue,
      (index) => {
        const select = el.value
        if (select && select.getSelectedIndex() !== index) select.setSelectedIndex(index ?? 0)
      },
    )
    watch(
      () => props.options,
      (options) => {
        if (el.value) el.value.options = options as never
      },
    )

    return () => {
      const attrs: Record<string, unknown> = { ref: el }
      if (props.showDescription !== undefined) attrs.showDescription = props.showDescription
      if (props.wrapSelection !== undefined) attrs.wrapSelection = props.wrapSelection
      return h('select', attrs)
    }
  },
}) as DefineComponent<SelectProps>
