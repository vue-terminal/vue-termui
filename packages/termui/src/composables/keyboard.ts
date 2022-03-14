import {
  App,
  inject,
  InjectionKey,
  onMounted,
  onUnmounted,
} from '@vue/runtime-core'
import { exitApp } from '../app/createApp'
import { DataToKey, parseInputSequence } from '../input/inputSequences'
import type {
  KeyboardEventHandler,
  KeyboardEventHandlerFn,
  KeyboardEventKeyCode,
  KeyboardEventRawHandlerFn,
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
  const eventMap = inject(EventMapSymbol)
  if (!eventMap) {
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
    if (!eventMap.has(key)) {
      eventMap.set(key, new Set())
    }
  }
  const listenersList = keys.map((key) => eventMap.get(key)!)

  onMounted(() => {
    listenersList.forEach((list) => list.add(handler!))
  })
  const removeListener = () => {
    listenersList.forEach((list) => list.delete(handler!))
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

  stdin.addListener('data', handleOnData)
  setRawMode(true)

  return () => {
    setRawMode(false)
    stdin.off('data', handleOnData)
  }
}
