import { InputRenderable, InputRenderableEvents } from '@opentui/core'
import {
  type DefineComponent,
  defineComponent,
  h,
  onMounted,
  type PropType,
  shallowRef,
  watch,
} from '@vue/runtime-core'
import type { ColorInput } from './types'

/** Props accepted by {@link Input}. */
export interface InputProps {
  /** Current text value. Use with `v-model`. */
  modelValue?: string
  /** Placeholder shown while empty. */
  placeholder?: string
  /** Maximum number of characters. */
  maxLength?: number
  /** Focus the input as soon as it mounts. */
  focus?: boolean
  /** Text color. */
  textColor?: ColorInput
  /** Background color. */
  backgroundColor?: ColorInput
  /** Background color while focused. */
  focusedBackgroundColor?: ColorInput
}

/**
 * Single-line text input mapping to OpenTUI's `InputRenderable`. Supports
 * `v-model` for the text value and emits `submit` when Enter is pressed.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Input, ref } from 'vue-termui'
 * const name = ref('')
 * </script>
 * <template>
 *   <Input v-model="name" placeholder="Your name" focus @submit="save" />
 * </template>
 * ```
 */
export const Input = defineComponent({
  name: 'Input',

  props: {
    modelValue: { type: String, default: '' },
    placeholder: String,
    maxLength: Number,
    focus: Boolean,
    textColor: [String, Object] as PropType<ColorInput>,
    backgroundColor: [String, Object] as PropType<ColorInput>,
    focusedBackgroundColor: [String, Object] as PropType<ColorInput>,
  },

  emits: {
    'update:modelValue': (value: string) => typeof value === 'string',
    submit: (value: string) => typeof value === 'string',
  },

  setup(props, { emit }) {
    const el = shallowRef<InputRenderable | null>(null)

    onMounted(() => {
      const input = el.value
      if (!input) return

      // Seed the renderable with the initial model value, then mirror user
      // edits back out through `v-model`.
      if (props.modelValue !== input.value) input.value = props.modelValue ?? ''
      input.on(InputRenderableEvents.INPUT, () => {
        if (input.value !== props.modelValue) emit('update:modelValue', input.value)
      })
      input.on(InputRenderableEvents.ENTER, () => emit('submit', input.value))

      if (props.focus) input.focus()
    })

    // Keep the renderable in sync when the model changes from the outside.
    watch(
      () => props.modelValue,
      (value) => {
        const input = el.value
        if (input && input.value !== value) input.value = value ?? ''
      },
    )

    return () => {
      // Only forward props the user actually set: passing `undefined` would
      // overwrite the renderable's defaults (e.g. `maxLength` defaults to 1000,
      // and `undefined` there silently swallows all typed input).
      const attrs: Record<string, unknown> = { ref: el }
      if (props.placeholder !== undefined) attrs.placeholder = props.placeholder
      if (props.maxLength !== undefined) attrs.maxLength = props.maxLength
      if (props.textColor !== undefined) attrs.textColor = props.textColor
      if (props.backgroundColor !== undefined) attrs.backgroundColor = props.backgroundColor
      if (props.focusedBackgroundColor !== undefined) {
        attrs.focusedBackgroundColor = props.focusedBackgroundColor
      }
      return h('input', attrs)
    }
  },
  // `as DefineComponent<InputProps>` gives the export an explicit type
  // (required by isolatedDeclarations) and a clean prop surface for editors.
}) as DefineComponent<InputProps>
