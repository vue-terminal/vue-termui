import { LiteralUnion } from '../utils'

/**
 * Base for real keypress events.
 * @internal
 */
export interface _InputDataEventModifiers {
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

/**
 * Raw information of an input event and its parsed event if any.
 */
export interface InputDataEvent {
  data: string

  /**
   * Parsed event (`MouseEventData` or `KeyDataEvent`) when possible, `null` otherwise.
   */
  event: KeyDataEvent | MouseDataEvent | null | undefined
}

/**
 * Raw information about an event
 */
export interface InputDataEventHandler {
  (input: InputDataEvent): void
}

export function isInputDataEvent(event: unknown): event is InputDataEvent {
  return (
    !!event && typeof event === 'object' && 'data' in event && 'event' in event
  )
}

/**
 * A recognized and correctly parsed Key Event.
 */
export interface KeyDataEvent extends _InputDataEventModifiers {
  /**
   * The pressed key in text. Special keys have their own representation while regular key letters like A, B, are just
   * that, A, B, etc.
   */
  key: LiteralUnion<KeyDataEventKeyCode, string>
}

export function isKeyDataEvent(
  event: unknown
): event is KeyDataEvent | KeyDataEventRaw {
  return !!event && typeof event === 'object' && 'key' in event
}

/**
 * An unrecognized key event
 */
export interface KeyDataEventRaw extends _InputDataEventModifiers {
  /**
   * raw data
   */
  input: string
  key: LiteralUnion<KeyDataEventKeyCode, string> | undefined
}

export interface KeyDataEventHandlerFn {
  (event: KeyDataEvent): void
}

export interface KeyDataEventRawHandlerFn {
  (event: KeyDataEventRaw): void
}

export type KeyDataEventHandler =
  | KeyDataEventHandlerFn
  | KeyDataEventRawHandlerFn

/**
 * Emulated keycodes based on browser's map to same event.key as in browser:
 * https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
 */
export type KeyDataEventKeyCode =
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

/**
 * Possible values for the `KeyDataEvent.key`.
 */
export type KeyDataEventKey = LiteralUnion<KeyDataEventKeyCode, string>

export const enum MouseEventButton {
  /**
   * Also known as `main`.
   */
  left = 0,
  /**
   * Also known as `auxiliary`, usually the wheel.
   */
  middle = 1,
  /**
   * Also known as secondary.
   */
  right = 2,
  // release = 3 // not really a button
}

export enum MouseEventType {
  // must be 0, 1, 2 to align with browser
  down,
  move,
  up,
  // specials
  any = -1,
  unknown = 99,
}

export interface MouseDataEvent extends _InputDataEventModifiers {
  button: MouseEventButton
  _type: MouseEventType
  clientX: number
  clientY: number
}

export interface MouseDataEventHandler {
  (event: MouseDataEvent): void
}

export function isMouseDataEvent(event: unknown): event is MouseDataEvent {
  return !!event && typeof event === 'object' && 'button' in event
}
