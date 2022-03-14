import type { LiteralUnion } from '../utils'
import type {
  KeyboardEventKeyCode,
  KeypressEvent,
  _InputEventModifiers,
  MouseEventButton,
  MouseEvent,
  MouseEventType,
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
  modifiers?: Partial<_InputEventModifiers>
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

/**
 * Conveniently define a mouse event.
 *
 * @param key - key to define the keypress
 * @param modifiers - optional modifiers
 * @returns
 */
export function defineMouseEvent(
  button: MouseEventButton,
  clientX: number,
  clientY: number,
  _type: MouseEventType,
  modifiers?: Partial<_InputEventModifiers>
): MouseEvent {
  return {
    button,
    _type,
    clientX,
    clientY,
    altKey: false,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    ...modifiers,
  }
}
