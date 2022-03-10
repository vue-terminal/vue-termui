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

export interface KeyboardHandlerFn {
  (event: TODO): void
}

// TODO: can probably infer some types

export function onKeypress(
  key: string,
  handler: KeyboardHandlerFn,
  // maybe for modifiers like ctrl, etc
  options?: TODO
) {
  const eventMap = inject(EventMapSymbol)
  if (!eventMap) {
    // TODO: error
    throw new Error('you forgot to call attachKeyboardHandler')
  }

  if (!eventMap.has(key)) {
    eventMap.set(key, new Set())
  }

  const listenerList = eventMap.get(key)!

  onMounted(() => {
    listenerList.add(handler)
  })

  onUnmounted(() => {
    listenerList.delete(handler)
  })
}

export const EventMapSymbol = Symbol() as InjectionKey<
  Map<string, Set<KeyboardHandlerFn>>
>

export function attachKeyboardHandler(
  app: App,
  stdin: NodeJS.ReadStream,
  { setRawMode }: KeyboardHandlerOptions
) {
  const eventMap = new Map<string, Set<KeyboardHandlerFn>>()

  app.provide(EventMapSymbol, eventMap)

  function handleOnData(data: Buffer) {
    const input = String(data)
    console.error(input)

    const key: string | undefined = DataToKey[input]

    if (key && eventMap.has(key)) {
      eventMap.get(key)!.forEach((handler) => {
        handler({ key })
      })
    }
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

// map to same event.key as in browser: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values

// TODO: does it work with a Map?

const DataToKey: Record<string, string> = {
  '\u001B[A': 'ArrowUp',
  // down: '\u001B[B',
  // left: '\u001B[D',
  // right: '\u001B[C',
  // pageDown: '\u001B[6~',
  // pageUp: '\u001B[5~',
  // enter: '\r',
  // escape: '\u001B',
  // tab: '\t',
  // tab: '\u001B[Z',
  // backspace: '\u0008',
  // delete: '\u007F',
  // delete: '\u001B[3~',
}

export function isRawModeSupported(stdin: NodeJS.ReadStream) {
  return stdin.isTTY
}
