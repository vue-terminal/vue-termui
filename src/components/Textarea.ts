import type { TextareaRenderable, TextareaOptions } from '@opentui/core'
import { defineComponent, h, onMounted, shallowRef, type VNode } from '@vue/runtime-core'
import {
  type ExtractEventsNames,
  optionalBooleanProps,
  type RenderableEventProps,
  renderableEmits,
  setupRenderableEvents,
  type TuiComponent,
} from './utils'

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
export interface TextareaProps
  extends Omit<TextareaOptions, 'initialValue' | 'onSubmit'>, RenderableEventProps {
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
   * Emitted when the user edits the text.
   */
  'onUpdate:modelValue'?: (value: string) => void

  /**
   * Emitted on Meta/Cmd+Enter (OpenTUI's default submit keybinding), with the
   * current text.
   */
  onSubmit?: (value: string) => void
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
 *     autofocus
 *     @submit="(text) => console.log(text)"
 *   />
 * </template>
 * ```
 */
export const Textarea: TuiComponent<TextareaProps, TextareaRenderable> = defineComponent({
  name: 'Textarea',
  props: {
    modelValue: String,
    autofocus: Boolean,
    // not cast to boolean, kept optional so an unset prop preserves the
    // renderable's own `focusable` default (see `optionalBooleanProps`)
    focusable: null,
  },
  // for type safety and to avoid runtime warnings
  // but we rely on TextareaProps declaration as onUpdate:modelValue for component-usage type safety
  emits: {
    'update:modelValue': (value: string) => typeof value === 'string',
    submit: (value: string) => typeof value === 'string',
    ...renderableEmits,
  } satisfies ExtractEventsNames<TextareaProps, Omit<TextareaOptions, 'onSubmit'>>,
  setup(props, { emit, attrs }) {
    const textarea = shallowRef<TextareaRenderable | null>(null)

    onMounted(() => {
      const el = textarea.value
      if (!el) return

      // Mirror user edits back out through `v-model`. `ContentChangeEvent` is
      // empty, so read the current text off the renderable; the guard absorbs
      // the change the initial seed emits.
      el.onContentChange = () => {
        if (el.plainText !== props.modelValue) emit('update:modelValue', el.plainText)
      }

      // Meta/Cmd+Enter submits (OpenTUI's default keybinding). `SubmitEvent` is
      // empty, so forward the current text as the payload.
      el.onSubmit = () => emit('submit', el.plainText)

      // Common Renderable events + autofocus on mount
      setupRenderableEvents(el, emit, { autofocus: props.autofocus })
    })

    return (): VNode =>
      h('textarea', {
        // native options and listeners
        ...attrs,
        ...optionalBooleanProps(props, ['focusable']),
        // Seed the editor through the renderable's `initialValue`, which rides
        // the normal prop path: `patchProp` assigns it only when `modelValue`
        // changes (Vue skips unchanged props), and the `initialValue` setter is
        // one-time guarded — it applies the seed once and silently ignores later
        // reassignments, so this never clobbers the buffer/cursor or loops.
        initialValue: props.modelValue ?? attrs.value ?? '',
        ref: textarea,
      })
  },
})
