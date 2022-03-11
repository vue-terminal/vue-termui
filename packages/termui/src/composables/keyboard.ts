import {
  App,
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
} from '@vue/runtime-core'
import { DataToKey, parseInputSequence } from '../input/inputSequences'
import type {
  KeyboardEventHandler,
  KeyboardEventHandlerFn,
  KeyboardEventKeyCode,
  KeyboardEventRawHandlerFn,
} from '../input/types'
import { LiteralUnion } from '../utils'

export type RemoveListener = () => void

export function onKeypress(handler: KeyboardEventRawHandlerFn): RemoveListener
export function onKeypress(
  key: LiteralUnion<KeyboardEventKeyCode, string>,
  handler: KeyboardEventHandlerFn
): RemoveListener
export function onKeypress(
  keyOrHandler:
    | LiteralUnion<KeyboardEventKeyCode, string>
    | KeyboardEventHandler,
  handler?: KeyboardEventHandler
): RemoveListener {
  const eventMap = inject(EventMapSymbol)
  if (!eventMap) {
    // TODO: warning with getCurrentInstance()
    throw new Error('onKeypress must be called inside setup')
  }

  let key: string

  if (typeof keyOrHandler === 'function') {
    key = '@any'
    handler = keyOrHandler
  } else {
    key = keyOrHandler
  }

  if (!eventMap.has(key)) {
    eventMap.set(key, new Set())
  }

  const listenerList = eventMap.get(key)!

  onMounted(() => {
    listenerList.add(handler!)
  })
  const removeListener = () => {
    listenerList.delete(handler!)
  }
  onUnmounted(removeListener)
  return removeListener
}

export interface KeyboardHandlerOptions {
  setRawMode: (enabled: boolean) => void
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

    const eventKeypress = DataToKey.get(input) || parseInputSequence(input)

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
