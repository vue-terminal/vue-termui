import { LiteralUnion } from '../utils'

/**
 * Base for real keypress events.
 * @internal
 */
export interface _InputEventModifiers {
  /**
   * Is the Ctrl key pressed.
   */
  ctrlKey: boolean

  /**
   * Is the Alt key pressed.
   */
  altKey: boolean

  /**
   * Is the Shift key pressed.
   */
  shiftKey: boolean

  /**
   * You cannot use the meta key on a terminal, so this will often be false. But you can sometimes emulate it. For
   * example, doing ctrl + alt + Home will simulate a meta key being pressed instead of the alt key.
   */
  metaKey: boolean
}
export interface KeypressEvent extends _InputEventModifiers {
  /**
   * The pressed key in text. Special keys have their own representation while regular key letters like A, B, are just
   * that, A, B, etc.
   */
  key: LiteralUnion<KeyboardEventKeyCode, string>
}

export function isKeypressEvent(event: any): event is KeypressEvent {
  return 'key' in event
}

export interface KeypressEventRaw extends _InputEventModifiers {
  input: string
  key: LiteralUnion<KeyboardEventKeyCode, string> | undefined
}

export interface KeyboardEventHandlerFn {
  (event: KeypressEvent): void
}

export interface KeyboardEventRawHandlerFn {
  (event: KeypressEventRaw): void
}

export type KeyboardEventHandler =
  | KeyboardEventHandlerFn
  | KeyboardEventRawHandlerFn

/**
 * Emulated keycodes based on browser's map to same event.key as in browser:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
export type KeyboardEventKeyCode =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowRight'
  | 'ArrowLeft'
  | 'PageUp'
  | 'PageDown'
  | 'Enter'
  | 'Escape'
  | 'EscapeDouble'
  | 'Tab'

  // close to numeric pad
  | 'Backspace'
  | 'Delete'
  | 'Home'
  | 'Insert'
  | 'End'
  | 'PageUp'
  | 'PageDown'
  | 'Clear' // num clear
  // TODO: make sure these are the correct key values with
  // https://w3c.github.io/uievents/tools/key-event-viewer.html
  | 'Numpad0'
  | 'Numpad1'
  | 'Numpad2'
  | 'Numpad3'
  | 'Numpad4'
  | 'Numpad5'
  | 'Numpad6'
  | 'Numpad7'
  | 'Numpad8'
  | 'Numpad9'

  // Function buttons
  | 'F0'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'F10'
  | 'F11'
  | 'F12'
  | 'F13'
  | 'F14'
  | 'F15'
  | 'F16'
  | 'F17'
  | 'F18'
  | 'F19'
  | 'F20'

function defineKeypressEvent(
  key: KeyboardEventKeyCode,
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

export const enum MouseEventButton {
  main = 0, // usually left
  aux = 1, // usually wheel button
  secondary = 2, // usually the right button
  // release = 3 // not really a button
}

export const enum MouseEventType {
  down,
  move,
  up,
}

export interface MouseEvent extends _InputEventModifiers {
  button: MouseEventButton
  _type: MouseEventType
  clientX: number
  clientY: number
}

export function isMouseEvent(event: any): event is MouseEvent {
  return 'button' in event
}
