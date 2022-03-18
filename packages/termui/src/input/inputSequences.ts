import { inputDataToString } from './debug'
import { defineKeypressEvent, defineMouseEvent } from './keyEvents'
import {
  KeyDataEventKeyCode,
  KeyDataEvent,
  MouseDataEvent,
  MouseEventButton,
  MouseEventType,
  _InputDataEventModifiers,
} from './types'

/**
 * Special lookup of keys that do not exactly follow the VT or xterm semantics.
 */
export const SPECIAL_INPUT_KEY_TABLE = new Map<string, KeyDataEvent>([
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

  // Special handling of Function keys
  ['\x1bOP', defineKeypressEvent('F1')],
  ['\x1bOQ', defineKeypressEvent('F2')],
  ['\x1bOR', defineKeypressEvent('F3')],
  ['\x1bOS', defineKeypressEvent('F4')],
])

export function isRawModeSupported(stdin: NodeJS.ReadStream) {
  return stdin.isTTY
}

const INPUT_SEQ_START = '\x1b[' // CSI escape sequences
// https://www.systutorials.com/docs/linux/man/4-console_codes/
const MOUSE_SEQ_START = '\x1b[M' // Mouse click
const MOUSE_ENCODE_OFFSET = 32 // mouse values are encoded as numeric values + 040 (32 in octal)
const MOUSE_EXTENDED_SEQ_START = '\x1b[<' // Ends with M/m

const enum InputSequenceParserState {
  xterm,
  vt_keycode_and_modifier,
  vt_keycode_drop,
  vt_modifier_end_letter,
}

type CSISeqParsed = Array<string | number>

type MouseExtendedCSISeq = [number, number, number, string]
function isMouseExtendedCSISeq(seq: CSISeqParsed): seq is MouseExtendedCSISeq {
  return (
    seq.length === 4 &&
    typeof seq[0] === 'number' &&
    typeof seq[1] === 'number' &&
    typeof seq[2] === 'number' &&
    typeof seq[3] === 'string'
  )
}

// [keycode, ~] | [keycode, modifier, ~]
type VTKeycodeSeq = [number, '~'] | [number, number, '~']

function isVTKeycodeSeq(seq: CSISeqParsed): seq is VTKeycodeSeq {
  return (
    (seq.length === 2 && typeof seq[0] === 'number' && seq[1] === '~') ||
    (seq.length === 3 &&
      typeof seq[1] === 'number' &&
      typeof seq[2] === 'number' &&
      seq[3] === '~')
  )
}

function parseVTKeycodeSeq(seq: VTKeycodeSeq) {
  return {
    key: VT_KEYCODE_TABLE.get(seq[0]),
    // removes 1 by default because they all have 1 added
    modifier: seq.length === 2 ? 0 : seq[1] - 1,
  }
}

// [string keycode] | [modifier, string keycode] | [1, modifier, string keycode]
type XtermKeycodeSeq = [string] | [number, string] | [1, number, string]

function isXtermKeycodeSeq(seq: CSISeqParsed): seq is XtermKeycodeSeq {
  return (
    (seq.length === 1 && typeof seq[0] === 'string') ||
    (seq.length === 2 &&
      typeof seq[0] === 'number' &&
      typeof seq[1] === 'string') ||
    (seq.length === 3 &&
      typeof seq[1] === 'number' &&
      typeof seq[2] === 'string')
  )
}

function parseXtermKeycodeSeq(seq: XtermKeycodeSeq) {
  return {
    key: XTERM_KEYCODE_TABLE.get(seq[seq.length - 1] as string), // the last is always a string
    // removes 1 by default because they all have 1 added
    modifier: seq.length > 1 ? (seq[seq.length - 2] as number) - 1 : 0,
  }
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
): Array<MouseDataEvent | KeyDataEvent | undefined> {
  const inputSequences: Array<MouseDataEvent | KeyDataEvent | undefined> = []

  while (input) {
    if (input.startsWith(MOUSE_EXTENDED_SEQ_START)) {
      const { args, remaining } = parseCSISequence(input, 3)
      input = remaining

      if (isMouseExtendedCSISeq(args)) {
        const [modifier, x, y, endSeq] = args
        const isDragging = modifier & 32

        // TODO: wheel buttons / scroll when modifier & 64
        // TODO: extra buttons when modifier & 128
        const button: MouseEventButton = modifier & 0b11 // take the 2 lower bytes only, 0 - 3
        let type: MouseEventType
        if (endSeq === 'M' || endSeq === 'm') {
          type =
            endSeq === 'M'
              ? isDragging
                ? MouseEventType.move
                : MouseEventType.down
              : MouseEventType.up
        } else {
          // for debugging
          type = MouseEventType.unknown
        }

        inputSequences.push(
          defineMouseEvent(button, x, y, type, {
            shiftKey: !!(modifier & 4),
            metaKey: !!(modifier & 8),
            ctrlKey: !!(modifier & 16),
            // apparently altKey cannot be added
          })
        )
      } else {
        // unrecognized
        inputSequences.push(undefined)
      }
    } else if (input.startsWith(MOUSE_SEQ_START) && input.length > 3) {
      // Legacy mouse support, only handle basic operations and coordinates under 95
      // TODO: refactor to be similar to the mouse extended block above and simplify or remove
      const modifier = input.charCodeAt(3) - MOUSE_ENCODE_OFFSET
      const x = input.charCodeAt(4) - MOUSE_ENCODE_OFFSET
      const y = input.charCodeAt(5) - MOUSE_ENCODE_OFFSET
      const mouseButton = modifier & 0b11 // 3
      // TODO: handle mousemove and mouseup and correctly
      const type = mouseButton === 3 ? MouseEventType.up : MouseEventType.down
      // TODO: correctly handle release
      const button =
        mouseButton > 2
          ? MouseEventButton.left
          : (mouseButton as MouseEventButton)

      inputSequences.push(
        defineMouseEvent(button, x, y, type, {
          shiftKey: !!(modifier & 4),
          metaKey: !!(modifier & 8),
          ctrlKey: !!(modifier & 16),
          // alt does send other codes apparently and cannot be caught
        })
      )
      input = input.slice(6)
    } else if (input.startsWith(INPUT_SEQ_START) && input.length > 2) {
      const { args, remaining } = parseCSISequence(
        input,
        input.indexOf('[') + 1
      )
      input = remaining

      const { key, modifier } = isVTKeycodeSeq(args)
        ? // e.g. Home button \x1b[1~
          // the first number must be present and is a keycode number
          // the second is optional and is the modifier
          parseVTKeycodeSeq(args)
        : isXtermKeycodeSeq(args)
        ? // e.g.shift Home \x1b[1;2H
          parseXtermKeycodeSeq(args)
        : { key: undefined, modifier: 0 }

      // cannot handle non existent keys
      if (!key) {
        inputSequences.push(undefined)
      } else {
        inputSequences.push(
          defineKeypressEvent(key, {
            shiftKey: !!(modifier & 1),
            altKey: !!(modifier & 2),
            ctrlKey: !!(modifier & 4),
            metaKey: !!(modifier & 8),
          })
        )
      }
    } else {
      const charCode = input.charCodeAt(0)
      const charString = input.charAt(0)
      input = input.slice(1)
      // ctrl + A to Z
      if (charCode > 0 && charCode <= 0x1a) {
        inputSequences.push(
          defineKeypressEvent(
            String.fromCharCode(
              CHAR_A_CODE + charCode - 1
            ) as KeyDataEventKeyCode,
            {
              ctrlKey: true,
            }
          )
        )
      } else {
        // TODO: try consuming as much input as possible to output as a single chunk
        // e.g. doing composition: 你好 -> should output the whole nihao sentence in one event
        inputSequences.push(
          defineKeypressEvent(charString as KeyDataEventKeyCode, {
            shiftKey: charCode >= CHAR_A_CODE && charCode <= CHAR_Z_CODE,
          })
        )
      }
    }
  }

  return inputSequences
}

const CHAR_0_CODE = 0x30
const CHAR_9_CODE = 0x39
const CHAR_A_CODE = 0x41
const CHAR_Z_CODE = 0x5a
const CHAR_SPACE_CODE = 0x20 // start of valid values
const CHAR_TILDE_CODE = 0x7e // end of valid values

/**
 * Parses a CSI sequence into arguments. `startPos` must be after any special character after the `\x1b[`. e.g. if there
 * is an `<`, it should start after that.
 *
 * @param input - input to read from
 * @param startPos position where we should start reading
 */
function parseCSISequence(input: string, startPos: number) {
  let stringBuffer = ''
  // null means we are not reading a number. Anything else, we are reading a number
  let numericBuffer: null | number = null
  let pos = startPos

  // note an input could contain multiple events
  // \x1b\x1b -> Esc + Esc
  // \x1b$ -> Esc + $
  // \x1b[M !!\x1b[M$!! -> Mouse press + release
  // "\x1b[<1;67;27M\x1b[<1;67;27M" -> double middle click press?? in extended mouse capture

  // values read between, differentiates numerical and string
  // e.g. \x1b[A -> ['A'] (arrow up)
  // e.g. \x1b[1;2A -> [1, 2, 'A'] -> shift up
  // e.g. \x1b[1~ -> [1, '~'] -> Home
  // e.g. \x1b[1;2H -> [1, 2, 'H'] -> shift Home
  let readValues: Array<string | number> = []

  while (pos < input.length) {
    const readChar = input.charAt(pos)
    const readCharCode = input.charCodeAt(pos)

    if (readChar === ';') {
      // we finished reading one argument
      readValues.push(numericBuffer ?? stringBuffer)
      stringBuffer = ''
      numericBuffer = null
    } else if (readCharCode >= CHAR_0_CODE && readCharCode <= CHAR_9_CODE) {
      if (numericBuffer == null) {
        // first time we parse a number, we shouldn't have a value in stringBuffer
        numericBuffer = 0
      } else {
        // we are adding a number, so we must shift to the left in base 10
        numericBuffer *= 10
      }
      numericBuffer += readCharCode - CHAR_0_CODE // add the current number
      // an unfinished string buffer was started, consume it
      if (stringBuffer) {
        readValues.push(stringBuffer)
        stringBuffer = ''
      }
    } else if (
      readCharCode >= CHAR_SPACE_CODE &&
      readCharCode <= CHAR_TILDE_CODE
    ) {
      if (numericBuffer != null) {
        // we were parsing a number before, consume that and start parsing the string
        // this is usually at the end 1;2H or 1;46;52M
        readValues.push(numericBuffer)
        numericBuffer = null // reset the numeric buffer state
      }
      stringBuffer += readChar
    } else {
      // special character, terminate parsing and return the remaining
      pos--
      break
    }
    pos++
  }

  // we had some unfinished consuming
  if (pos >= input.length) {
    readValues.push(numericBuffer ?? stringBuffer)
  }

  return {
    args: readValues,
    remaining: input.slice(pos),
  }
}

const VT_KEYCODE_TABLE = new Map<number, KeyDataEventKeyCode>([
  // vt sequences
  [1, 'Home'],
  [2, 'Insert'],
  [3, 'Delete'],
  [4, 'End'],
  [5, 'PageUp'],
  [6, 'PageDown'],
  [7, 'Home'],
  [8, 'End'],

  [10, 'F0'],
  [11, 'F1'],
  [12, 'F2'],
  [13, 'F3'],
  [14, 'F4'],
  [15, 'F5'],
  // and we skip one because why not!
  [17, 'F6'],
  [18, 'F7'],
  [19, 'F8'],
  [20, 'F9'],
  [21, 'F10'],
  // another one!
  [23, 'F11'],
  [24, 'F12'],
  [25, 'F13'],
  [26, 'F14'],
  // such logic!
  [28, 'F15'],
  [29, 'F16'],
  // 🤯
  [31, 'F17'],
  [32, 'F18'],
  [33, 'F19'],
  [34, 'F20'],
])

const XTERM_KEYCODE_TABLE = new Map<string, KeyDataEventKeyCode>([
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
