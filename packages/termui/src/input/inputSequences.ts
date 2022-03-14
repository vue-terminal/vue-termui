import { debugSequence } from './debug'
import { defineKeypressEvent, defineMouseEvent } from './keyEvents'
import {
  KeyboardEventKeyCode,
  KeypressEvent,
  MouseEvent,
  MouseEventButton,
  MouseEventType,
  _InputEventModifiers,
} from './types'

/**
 * Special lookup of keys that do not exactly follow the VT or xterm semantics.
 */
export const DataToKey = new Map<string, KeypressEvent>([
  // I have no idea why this is like this
  // specific to iTerm
  ['\x1b\x1b[A', defineKeypressEvent('ArrowUp', { altKey: true })],
  ['\x1b\x1b[B', defineKeypressEvent('ArrowDown', { altKey: true })],
  ['\x1b\x1b[C', defineKeypressEvent('ArrowRight', { altKey: true })],
  ['\x1b\x1b[D', defineKeypressEvent('ArrowLeft', { altKey: true })],

  // This one can also be triggered with shift, so it doesn't make sense to be included
  // ['\x1B\x1B[5~', defineKeypressEvent('PageUp', {altKey: true})],
  // ['\x1B[6~', 'PageDown'],

  ['\r', defineKeypressEvent('Enter')],
  ['\x1b', defineKeypressEvent('Escape')],
  // can be doubled and seems to be specific to terminal
  ['\x1b\x1b', defineKeypressEvent('EscapeDouble')],

  ['\t', defineKeypressEvent('Tab')],
  ['\x1b[Z', defineKeypressEvent('Tab', { shiftKey: true })],

  // ['\x08', 'Backspace'],
  ['\x7f', defineKeypressEvent('Backspace')],
  ['\x1b[3~', defineKeypressEvent('Delete')],
  //   ['\x01', 'Delete'],
])

export function isRawModeSupported(stdin: NodeJS.ReadStream) {
  return stdin.isTTY
}

const INPUT_SEQ_START_CHAR = '\x1b' // <esc> <char>, e.g. F4
const INPUT_SEQ_START = '\x1b[' // complex sequences
const INPUT_SEQ_START_2 = '\x1b\x1b[' // also complex sequences
const MOUSE_SEQ_START = '\x1b[M' // Mouse click
// https://www.systutorials.com/docs/linux/man/4-console_codes/
const MOUSE_ENCODE_OFFSET = 32 // mouse values are encoded as numeric values + 040 (32 in octal)

const enum InputSequenceParserState {
  xterm,
  vt_keycode_and_modifier,
  vt_keycode_drop,
  vt_modifier_end_letter,
}

/**
 * Parses the input data based on vt and xterm escape sequences.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#Terminal_input_sequences. This assumes the input sequence is not in
 * the special table above.
 *
 * @param input data coming from stdin
 */
export function parseInputSequence(
  input: string
): MouseEvent | KeypressEvent | undefined {
  if (input.startsWith(MOUSE_SEQ_START) && input.length > 3) {
    const modifier = input.charCodeAt(3) - MOUSE_ENCODE_OFFSET
    const x = input.charCodeAt(4) - MOUSE_ENCODE_OFFSET
    const y = input.charCodeAt(5) - MOUSE_ENCODE_OFFSET
    debugger
    const mouseButton = modifier & 0b11 // 3
    // TODO: handle mousemove and mouseup and correctly
    const type = mouseButton === 3 ? MouseEventType.up : MouseEventType.down
    // TODO: correctly handle realease
    const button =
      mouseButton > 2
        ? MouseEventButton.main
        : (mouseButton as MouseEventButton)

    return defineMouseEvent(button, x, y, type, {
      shiftKey: !!(modifier & 4),
      metaKey: !!(modifier & 8),
      ctrlKey: !!(modifier & 16),
      // alt does send other codes apparently and cannot be caught
    })
  } else if (
    (input.startsWith(INPUT_SEQ_START) && input.length > 2) ||
    (input.startsWith(INPUT_SEQ_START_2) && input.length > 3)
  ) {
    let buffer = ''
    let pos = input.indexOf('[') + 1 // start after the [
    let keycode: string | undefined
    let modifier: number = 1 // default modifier
    let state: InputSequenceParserState = InputSequenceParserState.xterm

    if (input.endsWith('~')) {
      // the first number must be present and is a keycode number
      state = InputSequenceParserState.vt_keycode_and_modifier
    } else if (/[A-Z]$/.test(input)) {
      // the letter is the keycode value and the optional number is the modifier value
      // they keycode is dropped, usually equals 1
      state = InputSequenceParserState.vt_keycode_drop
    }

    while (pos < input.length) {
      const readChar = input.charAt(pos)

      if (state === InputSequenceParserState.vt_keycode_and_modifier) {
        if (readChar === '~') {
          // end of sequence
          // keycode = buffer
          break
        } else if (readChar === ';') {
          // we read a keycode, onto the modifier
          keycode = buffer
          buffer = ''
        } else {
          buffer += readChar
        }
      } else if (state === InputSequenceParserState.vt_keycode_drop) {
        if (readChar === ';') {
          // drop the buffer and move into getting the modifier and keycode
          buffer = ''
          state = InputSequenceParserState.vt_modifier_end_letter
        } else {
          // since the ; is optional we might never find it, so we still need to keep the buffer as it could become the
          // keycode
          buffer += readChar
        }
      } else if (state === InputSequenceParserState.vt_modifier_end_letter) {
        const charCode = readChar.charCodeAt(0)
        if (charCode >= A_CHAR_CODE && charCode <= Z_CHAR_CODE) {
          // end sequence
          keycode = readChar
          modifier = Number(buffer) || 1
          break
        } else {
          buffer += readChar
        }
      }

      pos++
    }

    // we always remove one
    modifier--
    // consume the buffer if it wasn't consumed
    keycode = keycode || buffer
    const key = VT_SEQ_TABLE.get(keycode)
    // TODO: non existent keys
    if (!key) {
      console.error({ modifier, keycode, input: debugSequence(input), state })
      throw new Error(`Report bug for ${keycode} and say what did you press`)
    }

    return defineKeypressEvent(key, {
      shiftKey: !!(modifier & 1),
      altKey: !!(modifier & 2),
      ctrlKey: !!(modifier & 4),
      // specified by spec but doesn't work
      metaKey: !!(modifier & 8),
    })
  } else if (input.length === 1) {
    const charCode = input.charCodeAt(0)
    // ctrl + A to Z
    if (charCode > 0 && charCode <= 0x1a) {
      return defineKeypressEvent(
        String.fromCharCode(A_CHAR_CODE + charCode - 1) as KeyboardEventKeyCode,
        {
          ctrlKey: true,
        }
      )
    } else {
      return defineKeypressEvent(input as KeyboardEventKeyCode, {
        shiftKey: charCode >= A_CHAR_CODE && charCode <= Z_CHAR_CODE,
      })
    }
  }

  return
}

const A_CHAR_CODE = 0x41
const Z_CHAR_CODE = 0x5a

const VT_SEQ_TABLE = new Map<string, KeyboardEventKeyCode>([
  // vt sequences
  ['1', 'Home'],
  ['2', 'Insert'],
  ['3', 'Delete'],
  ['4', 'End'],
  ['5', 'PageUp'],
  ['6', 'PageDown'],
  ['7', 'Home'],
  ['8', 'End'],

  ['10', 'F0'],
  ['11', 'F1'],
  ['12', 'F2'],
  ['13', 'F3'],
  ['14', 'F4'],
  ['15', 'F5'],
  // and we skip one because why not!
  ['17', 'F6'],
  ['18', 'F7'],
  ['19', 'F8'],
  ['20', 'F9'],
  ['21', 'F10'],
  // another one!
  ['23', 'F11'],
  ['24', 'F12'],
  ['25', 'F13'],
  ['26', 'F14'],
  // such logic!
  ['28', 'F15'],
  ['29', 'F16'],
  // 🤯
  ['31', 'F17'],
  ['32', 'F18'],
  ['33', 'F19'],
  ['34', 'F20'],

  // xterm sequences
  ['A', 'ArrowUp'],
  ['B', 'ArrowDown'],
  ['C', 'ArrowRight'],
  ['D', 'ArrowLeft'],

  ['F', 'End'],
  // TODO: I can't test this one, what is the actual key named?
  // https://w3c.github.io/uievents/tools/key-event-viewer.html
  ['G', 'Numpad5'],
  ['H', 'Home'],
  ['P', 'F1'],
  ['Q', 'F2'],
  ['R', 'F3'],
  ['S', 'F4'],
])
