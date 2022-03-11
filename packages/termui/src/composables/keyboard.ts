import {
  App,
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
} from '@vue/runtime-core'

export interface KeyboardHandlerOptions {
  setRawMode: (enabled: boolean) => void
}

type TODO = any

export interface KeypressEvent {
  key: KeyboardEventKeyCode
}

export interface KeypressEventRaw {
  input: string
  key: KeyboardEventKeyCode | undefined
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
  key: string,
  handler: KeyboardEventHandlerFn,
  // maybe for modifiers like ctrl, etc
  options?: TODO
): RemoveListener
export function onKeypress(
  keyOrHandler: string | KeyboardEventHandler,
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
    console.error(input)

    const key = DataToKey.get(input)

    // if (!key) {
    //   console.error(`⚠️  You need to handle key "${input}"`)
    // }

    if (key && eventMap.has(key)) {
      eventMap.get(key)!.forEach((handler) => {
        ;(handler as KeyboardEventHandlerFn)({ key })
      })
    }
    eventMap.get('@any')!.forEach((handler) => {
      ;(handler as KeyboardEventRawHandlerFn)({ input, key })
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
  | 'Tab'
  | 'Tab'
  | 'Backspace'
  | 'Delete'
  | 'Delete'

const DataToKey = new Map<string, KeyboardEventKeyCode>([
  ['\u001B[A', 'ArrowUp'],
  ['\u001B[B', 'ArrowDown'],
  ['\u001B[C', 'ArrowRight'],
  ['\u001B[D', 'ArrowLeft'],

  ['\u001B[5~', 'PageUp'],
  ['\u001B[6~', 'PageDown'],

  ['\r', 'Enter'],
  ['\u001B', 'Escape'],

  ['\t', 'Tab'],
  ['\u001B[Z', 'Tab'],

  ['\u0008', 'Backspace'],
  ['\u007F', 'Delete'],
  ['\u001B[3~', 'Delete'],
])

export function isRawModeSupported(stdin: NodeJS.ReadStream) {
  return stdin.isTTY
}
