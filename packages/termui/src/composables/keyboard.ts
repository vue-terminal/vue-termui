import {
  App,
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
} from '@vue/runtime-core'
import { exitApp } from '../app/createApp'
import {
  SPECIAL_INPUT_KEY_TABLE,
  parseInputSequence,
} from '../input/inputSequences'
import {
  isKeypressEvent,
  isMouseEvent,
  KeyboardEventHandler,
  KeyboardEventHandlerFn,
  KeyboardEventKeyCode,
  KeyboardEventRawHandlerFn,
  KeypressEvent,
  MouseEvent,
  MouseEventButton,
  MouseEventHandler,
  MouseEventType,
} from '../input/types'
import { LiteralUnion } from '../utils'

export type RemoveListener = () => void

type KeyboardEventKey = LiteralUnion<KeyboardEventKeyCode, string>

export function onKeypress(handler: KeyboardEventRawHandlerFn): RemoveListener
export function onKeypress(
  key: KeyboardEventKey | KeyboardEventKey[],
  handler: KeyboardEventHandlerFn
): RemoveListener
export function onKeypress(
  keyOrHandler: KeyboardEventKey | KeyboardEventKey[] | KeyboardEventHandler,
  handler?: KeyboardEventHandler
): RemoveListener {
  const keyEventMap = inject(KeyEventMapSymbol)
  if (!keyEventMap) {
    // TODO: warning with getCurrentInstance()
    exitApp()
    throw new Error('onKeypress must be called inside setup')
  }

  let keys: string[]

  if (typeof keyOrHandler === 'function') {
    keys = ['@any']
    handler = keyOrHandler
  } else {
    keys = Array.isArray(keyOrHandler) ? keyOrHandler : [keyOrHandler]
  }

  for (const key of keys) {
    if (!keyEventMap.has(key)) {
      keyEventMap.set(key, new Set())
    }
  }
  const listenersList = keys.map((key) => keyEventMap.get(key)!)

  onMounted(() => {
    listenersList.forEach((list) => list.add(handler!))
  })
  const removeListener = () => {
    listenersList.forEach((list) => list.delete(handler!))
  }
  onUnmounted(removeListener)
  return removeListener
}

export function onMouseEvent(
  type: MouseEventType,
  handler: MouseEventHandler
): RemoveListener
export function onMouseEvent(handler: MouseEventHandler): RemoveListener
export function onMouseEvent(
  typeOrHandler: MouseEventType | MouseEventHandler,
  handler?: MouseEventHandler
): RemoveListener {
  const mouseEventMap = inject(MouseEventMapSymbol)

  if (!mouseEventMap) {
    // TODO: warning with getCurrentInstance()
    exitApp()
    throw new Error('onMouseEvent must be called inside setup')
  }

  const type: MouseEventType =
    typeof typeOrHandler !== 'function' ? typeOrHandler : MouseEventType.any

  handler = handler || (typeOrHandler as MouseEventHandler)

  if (!mouseEventMap.has(type)) {
    mouseEventMap.set(type, new Set())
  }

  const listener = mouseEventMap.get(type)!

  onMounted(() => {
    listener.add(handler!)
  })
  const removeListener = () => {
    listener.delete(handler!)
  }
  onUnmounted(removeListener)
  return removeListener
}

export interface InputHandler {
  (event: MouseEvent | KeypressEvent): void
}

export function onInput(handler: InputHandler): RemoveListener {
  const mouseEventMap = inject(MouseEventMapSymbol)
  const keyEventMap = inject(KeyEventMapSymbol)!
  if (!mouseEventMap) {
    // TODO: warning with getCurrentInstance()
    exitApp()
    throw new Error('onMouseEvent must be called inside setup')
  }

  const mouseListeners = mouseEventMap.get(MouseEventType.any)!
  const keyListeners = keyEventMap.get('@any')!

  onMounted(() => {
    mouseListeners.add(handler)
    keyListeners.add(handler)
  })
  const removeListener = () => {
    mouseListeners.delete(handler)
    keyListeners.delete(handler)
  }
  onUnmounted(removeListener)

  return removeListener
}

export interface InputHandlerOptions {
  setRawMode: (enabled: boolean) => void
}

export const KeyEventMapSymbol = Symbol() as InjectionKey<
  Map<string, Set<KeyboardEventHandler>>
>

export const MouseEventMapSymbol = Symbol() as InjectionKey<
  Map<MouseEventType, Set<MouseEventHandler>>
>

export function attachInputHandler(
  app: App,
  stdin: NodeJS.ReadStream,
  { setRawMode }: InputHandlerOptions
) {
  const keyEventMap = new Map<string, Set<KeyboardEventHandler>>([
    // create an any handler
    ['@any', new Set()],
  ])

  const mouseEventMap = new Map<MouseEventType, Set<MouseEventHandler>>([
    // create an any handler
    [MouseEventType.any, new Set()],
  ])

  app.provide(KeyEventMapSymbol, keyEventMap)
  app.provide(MouseEventMapSymbol, mouseEventMap)

  function handleOnData(data: Buffer) {
    const input = String(data)

    const specialEvent = SPECIAL_INPUT_KEY_TABLE.get(input)

    const events = specialEvent ? [specialEvent] : parseInputSequence(input)

    for (const event of events) {
      if (isMouseEvent(event)) {
        if (mouseEventMap.has(event._type)) {
          mouseEventMap.get(event._type)!.forEach((handler) => {
            handler(event)
          })
        }
        mouseEventMap.get(MouseEventType.any)!.forEach((handler) => {
          // handler(event)
          handler({
            ...event,
            // @ts-expect-error: useful for debugging
            input,
          })
        })
      } else if (isKeypressEvent(event)) {
        if (keyEventMap.has(event.key)) {
          keyEventMap.get(event.key)!.forEach((handler) => {
            ;(handler as KeyboardEventHandlerFn)(event)
          })
        }
        keyEventMap.get('@any')!.forEach((handler) => {
          ;(handler as KeyboardEventRawHandlerFn)({
            input,
            ...event,
          })
        })
      }
    }
  }

  stdin.addListener('data', handleOnData)
  setRawMode(true)

  return () => {
    setRawMode(false)
    stdin.off('data', handleOnData)
  }
}
