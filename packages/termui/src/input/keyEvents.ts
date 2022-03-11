import type { LiteralUnion } from '../utils'
import type {
  KeyboardEventKeyCode,
  KeypressEvent,
  _KeypressEventModifiers,
} from './types'

/**
 * Conveniently define a keypress.
 *
 * @param key - key to define the keypress
 * @param modifiers - optional modifiers
 * @returns
 */
export function defineKeypressEvent(
  key: LiteralUnion<KeyboardEventKeyCode, string>,
  modifiers?: Partial<_KeypressEventModifiers>
): KeypressEvent {
  return {
    key,
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...modifiers,
  }
}
