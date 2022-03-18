import type { LiteralUnion } from '../utils'
import type {
  KeyDataEventKeyCode,
  KeyDataEvent,
  _InputDataEventModifiers,
  MouseEventButton,
  MouseDataEvent,
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
  key: LiteralUnion<KeyDataEventKeyCode, string>,
  modifiers?: Partial<_InputDataEventModifiers>
): KeyDataEvent {
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
  modifiers?: Partial<_InputDataEventModifiers>
): MouseDataEvent {
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
