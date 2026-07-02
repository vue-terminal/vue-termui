import {
  type InputRenderable,
  InputRenderableEvents,
  type InputRenderableOptions,
} from '@opentui/core'
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
 * Props accepted by {@link Input}. Extends OpenTUI's native `InputRenderable`
 * options (`placeholder`, `maxLength`, `textColor`, …), which fall through to
 * the underlying renderable; the extra props below drive `v-model` and focus.
 */
export interface InputProps extends Omit<InputRenderableOptions, 'onSubmit'>, RenderableEventProps {
  /**
   * Current text value. Use with `v-model`.
   */
  modelValue?: string

  /**
   * Emitted when the user edits the text
   */
  'onUpdate:modelValue'?: (value: string) => void

  /**
   * Emitted after the input is blurred or enter is pressed and the value has
   * changed since the last `change` event.
   */
  onChange?: (value: string) => void

  /**
   * Emitted when the user presses Enter (Return) while the input is focused.
   */
  onEnter?: (value: string) => void

  /**
   * Emitted on every keystroke, including when the value is changed
   * programmatically like wiht copy/paste.
   */
  onInput?: (value: string) => void
}

/**
 * Single-line text input mapping to OpenTUI's `InputRenderable`. Supports
 * `v-model` for the text value.
 *
 * There is deliberately no `submit`/Enter event: submission is a form concept,
 * not an input one, and OpenTUI's `InputRenderable` never fires the `onSubmit`
 * it inherits from `TextareaRenderable`. To react to Enter, use the keyboard
 * composable (`onKeyDown((key) => key.name === 'return' && …)`).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Input, ref } from 'vue-termui'
 * const name = ref('')
 * </script>
 * <template>
 *   <Input v-model="name" placeholder="Your name" autofocus />
 * </template>
 * ```
 */
export const Input: TuiComponent<InputProps, InputRenderable> = defineComponent({
  name: 'Input',
  props: {
    modelValue: String,
    ...renderableProps,
  },
  // for type safety and to avoid runtime warnings
  // but we rely on InputProps declaration as onUpdate:modelValue for component-usage type safety
  emits: {
    'update:modelValue': (value: string) => typeof value === 'string',
    change: (value: string) => typeof value === 'string',
    enter: (value: string) => typeof value === 'string',
    input: (value: string) => typeof value === 'string',
    ...renderableEmits,
  } satisfies ExtractEventsNames<InputProps, InputRenderableOptions>,
  setup(props, { emit, attrs }) {
    const input = shallowRef<InputRenderable | null>(null)

    onMounted(() => {
      const el = input.value
      if (!el) return

      // Setup all InputRenderable events
      el.on(InputRenderableEvents.INPUT, () => {
        emit('input', el.value)
        if (el.value !== props.modelValue) emit('update:modelValue', el.value)
      })
      el.on(InputRenderableEvents.CHANGE, () => {
        emit('change', el.value)
      })
      el.on(InputRenderableEvents.ENTER, () => {
        emit('enter', el.value)
      })

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, props)
    })

    return (): VNode =>
      h('input', {
        // native options and listeners
        ...attrs,
        ...optionalBooleanProps(props, ['focusable']),
        // our overrides
        value: props.modelValue ?? attrs.value ?? '',
        ref: input,
      })
  },
})
