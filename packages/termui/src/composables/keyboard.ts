import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { KeyEventMapSymbol } from '../input/handling'
import { exitApp } from '../app/createApp'
import {
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
