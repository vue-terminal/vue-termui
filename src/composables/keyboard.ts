import { onScopeDispose } from '@vue/runtime-core'
import { useRenderer } from '../renderer/index'
import type { RemoveListener } from '../utils/types'

/**
 * A parsed keyboard event, as delivered by OpenTUI. Mirrors the public surface
 * of OpenTUI's internal `KeyEvent` (not re-exported from `@opentui/core`) so
 * handlers stay typed without leaking the implementation type.
 */
export interface KeyEvent {
  /**
   * Normalized key name, e.g. `'a'`, `'return'`, `'escape'`, `'up'`.
   */
  name: string

  /**
   * Whether Ctrl was held.
   */
  ctrl: boolean

  /**
   * Whether Meta (Command/Windows) was held.
   */
  meta: boolean

  /**
   * Whether Shift was held.
   */
  shift: boolean

  /**
   * Whether Alt/Option was held.
   */
  option: boolean

  /**
   * The raw escape sequence that produced this event.
   */
  sequence: string

  /**
   * The original bytes received.
   */
  raw: string

  /**
   * `'press'`, `'release'` or `'repeat'`.
   */
  eventType: string

  /**
   * Which parser produced the event.
   */
  source: 'raw' | 'kitty'

  /**
   * Marks the event handled so OpenTUI stops propagating it.
   */
  preventDefault(): void

  /**
   * Stops the event from reaching further handlers.
   */
  stopPropagation(): void
}

type KeyEventName = 'keypress' | 'keyrelease'

function onKey(eventName: KeyEventName, handler: (event: KeyEvent) => void): RemoveListener {
  const { keyInput } = useRenderer()
  // `keyInput` is a typed emitter (`keypress`/`keyrelease` deliver OpenTUI's
  // `KeyEvent`, which is assignable to our public mirror), so no cast is needed.
  keyInput.on(eventName, handler)
  const remove: RemoveListener = () => keyInput.off(eventName, handler)
  onScopeDispose(remove, true)
  return remove
}

/**
 * Runs `handler` on every key press while the calling component is mounted. The
 * listener is removed automatically on unmount; the returned function removes it
 * early.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { onKeyDown, useExit } from 'vue-termui'
 * const exit = useExit()
 * onKeyDown((key) => {
 *   if (key.name === 'q' || (key.ctrl && key.name === 'c')) exit()
 * })
 * </script>
 * ```
 */
export function onKeyDown(handler: (event: KeyEvent) => void): RemoveListener {
  return onKey('keypress', handler)
}

/**
 * Runs `handler` on every key release. Only fires for terminals using the Kitty
 * keyboard protocol (`useKittyKeyboard` in the renderer config); ordinary
 * terminals report presses only. Same lifetime/cleanup rules as {@link onKeyDown}.
 */
export function onKeyUp(handler: (event: KeyEvent) => void): RemoveListener {
  return onKey('keyrelease', handler)
}
