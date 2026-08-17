import { onScopeDispose } from '@vue/runtime-core'
import { useRenderer } from '../renderer/index'
import type { RemoveListener } from '../utils/types'

/**
 * What kind of payload a paste carried, when the terminal reports it.
 */
export type PasteKind = 'text' | 'binary' | 'unknown'

/**
 * Extra information some terminals attach to a paste.
 */
export interface PasteMetadata {
  /**
   * MIME type of the pasted payload, e.g. `'text/plain'`.
   */
  mimeType?: string

  /**
   * Whether the payload is text, binary, or undetermined.
   */
  kind?: PasteKind
}

/**
 * A bracketed-paste event, as delivered by OpenTUI. Mirrors the public surface
 * of OpenTUI's internal `PasteEvent` so handlers stay typed without leaking the
 * implementation type.
 */
export interface PasteEvent {
  /**
   * Always `'paste'`; lets one handler discriminate between event kinds.
   */
  type: 'paste'

  /**
   * The pasted payload. Raw bytes, because a paste can carry binary data —
   * decode it with `decodePasteBytes()` to get a string.
   */
  bytes: Uint8Array

  /**
   * Payload details, when the terminal reports them.
   */
  metadata?: PasteMetadata

  /**
   * Whether {@link preventDefault} was called.
   */
  readonly defaultPrevented: boolean

  /**
   * Whether {@link stopPropagation} was called.
   */
  readonly propagationStopped: boolean

  /**
   * Marks the paste handled so OpenTUI stops propagating it — in particular, so
   * a focused `Input`/`Textarea` doesn't also insert the text.
   */
  preventDefault(): void

  /**
   * Stops the paste from reaching further handlers.
   */
  stopPropagation(): void
}

/**
 * Runs `handler` whenever the user pastes, while the calling component is
 * mounted. The listener is removed automatically on unmount; the returned
 * function removes it early.
 *
 * This listens app-wide, so it fires no matter what has focus. To handle a paste
 * only while one element is focused, bind `@paste` on that component instead.
 *
 * Requires a terminal that supports bracketed paste; without it, a paste arrives
 * as ordinary keystrokes and no paste event is emitted.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { decodePasteBytes, onPaste, ref } from 'vue-termui'
 * const pasted = ref('')
 * onPaste((event) => {
 *   pasted.value = decodePasteBytes(event.bytes)
 * })
 * </script>
 * ```
 */
export function onPaste(handler: (event: PasteEvent) => void): RemoveListener {
  const { keyInput } = useRenderer()
  // `keyInput` is a typed emitter whose `paste` event delivers OpenTUI's
  // `PasteEvent`, assignable to our public mirror, so no cast is needed.
  keyInput.on('paste', handler)
  const remove: RemoveListener = () => keyInput.off('paste', handler)
  onScopeDispose(remove, true)
  return remove
}
