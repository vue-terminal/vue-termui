import { type TextareaRenderable, type TextareaOptions } from '@opentui/core'
import { type FunctionalComponent, h, type VNodeRef } from '@vue/runtime-core'

/**
 * Props accepted by {@link Textarea}. Extends OpenTUI's native `TextareaRenderable`
 * options (`placeholder`, `wrapMode`, colors, `keyBindings`, …), which fall
 * through to the underlying renderable; the extra props below drive `v-model`
 * and focus.
 *
 * `initialValue` and `onSubmit` are omitted from the native surface: the former
 * is managed here through `modelValue`, and the latter is re-exposed as the
 * typed `submit` event.
 */
export interface TextareaProps extends Omit<TextareaOptions, 'initialValue' | 'onSubmit'> {
  /**
   * Current text value. Use with `v-model`.
   *
   * This *seeds* the editor's initial content (via the renderable's one-time
   * `initialValue`) and is kept in sync as the user edits. Like OpenTUI's
   * `TextareaRenderable`, reassigning `modelValue` after mount does **not**
   * overwrite the buffer — a multi-line editor owns its own text, cursor and
   * undo history. Use a `:key` to force a fresh editor if you need to reset it.
   */
  modelValue?: string

  /**
   * Focus the textarea as soon as it mounts.
   */
  focus?: boolean
}

/**
 * Multi-line text editor mapping to OpenTUI's `TextareaRenderable`. Supports
 * `v-model` for the text value and cursor/selection/undo out of the box.
 *
 * Unlike {@link Input}, submission *is* a real Textarea concept: Enter inserts a
 * newline, and Meta/Cmd+Enter fires the `submit` event (OpenTUI's default
 * keybinding). The event carries the current text.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { Textarea, ref } from 'vue-termui'
 * const notes = ref('')
 * </script>
 * <template>
 *   <Textarea
 *     v-model="notes"
 *     placeholder="Type notes… (⌘+⏎ to submit)"
 *     :height="6"
 *     focus
 *     @submit="(text) => console.log(text)"
 *   />
 * </template>
 * ```
 */
type TextareaEmits = {
  'update:modelValue': (value: string) => void
  submit: (value: string) => void
}

// Event listeners (and the initial focus) are one-time, mount-shaped side
// effects, but a functional component has no lifecycle hooks. A function `ref`
// fills that gap: OpenTUI hands us the `TextareaRenderable` when it mounts. The
// `WeakSet` guard makes wiring idempotent — Vue may invoke the ref again on
// updates, and re-attaching would duplicate the listeners.
const wired = new WeakSet<TextareaRenderable>()

export const Textarea: FunctionalComponent<TextareaProps, TextareaEmits> = (
  props,
  { emit, attrs },
) =>
  h('textarea', {
    // Native options (`placeholder`, `wrapMode`, colors, `keyBindings`, …) fall
    // through as attributes: they only reach the renderable when actually set,
    // so unset props never overwrite the renderable's defaults.
    ...attrs,
    // Seed the editor through the renderable's `initialValue`, which rides the
    // normal prop path: `patchProp` assigns it only when `modelValue` changes
    // (Vue skips unchanged props), and the `initialValue` setter is one-time
    // guarded — it applies the seed once and silently ignores later
    // reassignments, so this never clobbers the buffer/cursor or loops.
    initialValue: props.modelValue,
    ref: ((textarea: TextareaRenderable | null) => {
      if (!textarea || wired.has(textarea)) return
      wired.add(textarea)

      // Mirror user edits back out through `v-model`. `ContentChangeEvent` is
      // empty, so read the current text off the renderable; the guard absorbs
      // the change the initial seed emits.
      textarea.onContentChange = () => {
        if (textarea.plainText !== props.modelValue) emit('update:modelValue', textarea.plainText)
      }

      // Meta/Cmd+Enter submits (OpenTUI's default keybinding). `SubmitEvent` is
      // empty, so forward the current text as the payload.
      textarea.onSubmit = () => emit('submit', textarea.plainText)

      if (props.focus) textarea.focus()
    }) as VNodeRef,
  })

Textarea.displayName = 'Textarea'
// Runtime prop declaration so `modelValue`/`focus` are extracted instead of
// falling through as attributes onto the host `<textarea>` element.
Textarea.props = {
  modelValue: String,
  focus: Boolean,
}
