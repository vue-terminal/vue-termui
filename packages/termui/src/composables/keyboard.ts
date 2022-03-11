import {
  App,
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
} from '@vue/runtime-core'
import { LiteralUnion } from '../utils'

export interface KeyboardHandlerOptions {
  setRawMode: (enabled: boolean) => void
}

type TODO = any

interface _KeypressEventModifiers {
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean

  /**
   * You cannot use the meta key on a terminal, so this will often be false. But you can sometimes emulate it. For
   * example, doing ctrl + alt + Home will simulate a meta key being pressed instead of the alt key.
   */
  metaKey: boolean
}
export interface KeypressEvent extends _KeypressEventModifiers {
  /**
   * The pressed key.
   */
  key: LiteralUnion<KeyboardEventKeyCode, string>
}

export interface KeypressEventRaw extends _KeypressEventModifiers {
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

// TODO: can probably infer some types

export type RemoveListener = () => void

export function onKeypress(
  handler: KeyboardEventRawHandlerFn,
  options?: TODO
): RemoveListener
export function onKeypress(
  key: LiteralUnion<KeyboardEventKeyCode, string>,
  handler: KeyboardEventHandlerFn,
  // maybe for modifiers like ctrl, etc
  options?: TODO
): RemoveListener
export function onKeypress(
  keyOrHandler:
    | LiteralUnion<KeyboardEventKeyCode, string>
    | KeyboardEventHandler,
  handlerOrOptions?: KeyboardEventHandler | TODO,
  // maybe for modifiers like ctrl, etc
  options?: TODO
): RemoveListener {
  const eventMap = inject(EventMapSymbol)
  if (!eventMap) {
    // TODO: warning with getCurrentInstance()
    throw new Error('onKeypress must be called inside setup')
  }

  let key: string
  let handler: KeyboardEventHandler

  if (typeof keyOrHandler === 'function') {
    key = '@any'
    handler = keyOrHandler
    options = handlerOrOptions
  } else {
    key = keyOrHandler
    handler = handlerOrOptions
  }

  if (!eventMap.has(key)) {
    eventMap.set(key, new Set())
  }

  const listenerList = eventMap.get(key)!

  onMounted(() => {
    listenerList.add(handler)
  })
  const removeListener = () => {
    listenerList.delete(handler)
  }
  onUnmounted(removeListener)
  return removeListener
}

export const EventMapSymbol = Symbol() as InjectionKey<
  Map<string, Set<KeyboardEventHandler>>
>

export function attachKeyboardHandler(
  app: App,
  stdin: NodeJS.ReadStream,
  { setRawMode }: KeyboardHandlerOptions
) {
  const eventMap = new Map<string, Set<KeyboardEventHandler>>([
    // create an any handler
    ['@any', new Set()],
  ])

  app.provide(EventMapSymbol, eventMap)

  function handleOnData(data: Buffer) {
    const input = String(data)

    let eventKeypress = DataToKey.get(input) || parseInputSequence(input)

    if (!eventKeypress) {
      const escapedSeq = input.split('').map(displayableChar).join('')
      console.error(`⚠️  You need to handle key "${escapedSeq}"`)
    }

    if (eventKeypress && eventMap.has(eventKeypress.key)) {
      eventMap.get(eventKeypress.key)!.forEach((handler) => {
        ;(handler as KeyboardEventHandlerFn)(eventKeypress!)
      })
    }
    eventMap.get('@any')!.forEach((handler) => {
      ;(handler as KeyboardEventRawHandlerFn)({
        key: undefined,
        ctrlKey: false,
        shiftKey: false,
        altKey: false,
        metaKey: false,
        input,
        ...eventKeypress,
      })
    })
  }

  // TODO: take again from here: this must be done only once and we must manually listen to ctrl+c
  stdin.setEncoding('utf8')

  stdin.addListener('data', handleOnData)
  stdin.resume()
  stdin.setRawMode(true)

  setRawMode(true)

  return () => {
    setRawMode(false)
    stdin.off('data', handleOnData)
  }
}

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

/**
 * Special lookup of keys that do not exactly follow the VT or xterm semantics.
 */
const DataToKey = new Map<string, KeypressEvent>([
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

const enum InputSequenceParserState {
  xterm,
  vt_keycode,
  vt_keycode_drop,
  vt_modifier,
  vt_modifier_end_letter,
}

/**
 * Parses the input data based on vt and xterm escape sequences.
 * https://en.wikipedia.org/wiki/ANSI_escape_code#Terminal_input_sequences. This assumes the input sequence is not in
 * the special table above.
 *
 * @param input data coming from stdin
 */
export function parseInputSequence(input: string): KeypressEvent | undefined {
  if (
    (input.startsWith(INPUT_SEQ_START) && input.length > 2) ||
    (input.startsWith(INPUT_SEQ_START_2) && input.length > 3)
  ) {
    let buffer = ''
    let pos = input.indexOf('[') + 1 // start after the [
    let keycode: string = ''
    let modifier: number = 1 // default modifier
    //
    let state: InputSequenceParserState = InputSequenceParserState.xterm

    if (input.endsWith('~')) {
      // the first number must be present and is a keycode number
      state = InputSequenceParserState.vt_keycode
    } else if (/[A-Z]$/.test(input)) {
      // the letter is the keycode value and the optional number is the modifier value
      // they keycode is dropped, usually equals 1
      state = InputSequenceParserState.vt_keycode_drop
    }

    while (pos < input.length) {
      const readChar = input.charAt(pos)

      if (state === InputSequenceParserState.vt_keycode) {
        if (readChar === '~') {
          // end of sequence
          keycode = buffer
          break
        } else if (readChar === ';') {
          // we read a keycode, onto the modifier
          keycode = buffer
          buffer = ''
          state = InputSequenceParserState.vt_modifier
        } else {
          buffer += readChar
        }
      } else if (state === InputSequenceParserState.vt_modifier) {
        if (readChar === '~') {
          // end of sequence
          break
        } else {
          buffer += readChar
        }
      } else if (state === InputSequenceParserState.vt_keycode_drop) {
        if (readChar === ';') {
          // drop the buffer and move into getting the modifier and keycode
          buffer = ''
          state = InputSequenceParserState.vt_modifier_end_letter
        } else {
          // since the ; is optional we might never find it
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
    const key = VT_SEQ_TABLE.get(keycode || buffer)
    // TODO: non existent keys
    if (!key) {
      console.error({ modifier, keycode, input: debugSequence(input), state })
      throw new Error(`Report bug for ${keycode}`)
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

/**
 * Debugs an escape code
 * @param c - char
 * @returns a display friendly ansi string
 */
function displayableChar(c: string) {
  const i = c.charCodeAt(0)
  if (
    // Ansi readable characters
    i >= 0x20 &&
    i <= 0x84 &&
    i !== 0x7f &&
    i !== 0x83
  ) {
    return c
  }

  if (i <= 0xff) {
    return `\\x${i.toString(16).padStart(2, '0')}`
  } else {
    return `\\u${i.toString(16).padStart(4, '0')}`
  }
}

function debugSequence(input: string) {
  return input.split('').map(displayableChar).join('')
}
