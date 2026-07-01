import {
  type InputRenderable,
  InputRenderableEvents,
  type InputRenderableOptions,
} from '@opentui/core'
import { type FunctionalComponent, h, type VNodeRef } from '@vue/runtime-core'

/**
 * Props accepted by {@link Input}. Extends OpenTUI's native `InputRenderable`
 * options (`placeholder`, `maxLength`, `textColor`, …), which fall through to
 * the underlying renderable; the extra props below drive `v-model` and focus.
 */
export interface InputProps extends Omit<InputRenderableOptions, 'onSubmit'> {
  /**
   * Current text value. Use with `v-model`.
   */
  modelValue?: string

  /**
   * Focus the input as soon as it mounts.
   */
  focus?: boolean
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
 *   <Input v-model="name" placeholder="Your name" focus />
 * </template>
 * ```
 */
type InputEmits = {
  'update:modelValue': (value: string) => void
}

// Event listeners (and the initial focus) are one-time, mount-shaped side
// effects, but a functional component has no lifecycle hooks. A function `ref`
// fills that gap: OpenTUI hands us the `InputRenderable` when it mounts. The
// `WeakSet` guard makes wiring idempotent — Vue may invoke the ref again on
// updates, and re-attaching would duplicate the listeners.
const wired = new WeakSet<InputRenderable>()

export const Input: FunctionalComponent<InputProps, InputEmits> = (props, { emit, attrs }) =>
  h('input', {
    // Native options (`placeholder`, `maxLength`, colors, …) fall through as
    // attributes: they only reach the renderable when actually set, so unset
    // props never overwrite its defaults (e.g. `maxLength` defaults to 1000,
    // and `undefined` would swallow typed input).
    ...attrs,
    // Outside → renderable sync rides the normal prop path: `patchProp` assigns
    // `el.value` only when `modelValue` actually changes (Vue skips unchanged
    // props), and the `value` setter is a no-op when the text already matches,
    // so this never clobbers the cursor or an uncontrolled input's text.
    value: props.modelValue,
    ref: ((input: InputRenderable | null) => {
      if (!input || wired.has(input)) return
      wired.add(input)

      // Mirror user edits back out through `v-model`. The guard also absorbs the
      // `INPUT` the `value` setter emits on an outside-driven change.
      input.on(InputRenderableEvents.INPUT, () => {
        if (input.value !== props.modelValue) emit('update:modelValue', input.value)
      })

      if (props.focus) input.focus()
    }) as VNodeRef,
  })

Input.displayName = 'Input'
// Runtime prop declaration so `modelValue`/`focus` are extracted instead of
// falling through as attributes onto the host `<input>` element.
Input.props = {
  modelValue: String,
  focus: Boolean,
}
// We don't need the runtime validation
// Input.emits = {
//   'update:modelValue': (value: string) => typeof value === 'string',
// }
