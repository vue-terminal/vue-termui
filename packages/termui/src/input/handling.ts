import { InjectionKey, App } from '@vue/runtime-core'
import { SPECIAL_INPUT_KEY_TABLE, parseInputSequence } from './inputSequences'
import {
  KeyboardEventHandler,
  MouseEventType,
  MouseEventHandler,
  isMouseEvent,
  isKeypressEvent,
  KeyboardEventHandlerFn,
  KeyboardEventRawHandlerFn,
} from './types'

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
          // TODO: remove or add input to all events?
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
