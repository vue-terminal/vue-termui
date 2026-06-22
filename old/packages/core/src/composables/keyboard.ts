import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { KeyEventMapSymbol } from '../input/handling'
import {
  KeyDataEventHandler,
  KeyDataEventHandlerFn,
  KeyDataEventKey,
  KeyDataEventRawHandlerFn,
} from '../input/types'
import { checkCurrentInstance, noop } from '../utils'

export type RemoveListener = () => void

export function onKeyData(handler: KeyDataEventRawHandlerFn): RemoveListener
export function onKeyData(
  key: KeyDataEventKey | KeyDataEventKey[],
  handler: KeyDataEventHandlerFn
): RemoveListener
export function onKeyData(
  keyOrHandler: KeyDataEventKey | KeyDataEventKey[] | KeyDataEventHandler,
  handler?: KeyDataEventHandler
): RemoveListener {
  if (!checkCurrentInstance('onInput')) return noop

  const keyEventMap = inject(KeyEventMapSymbol)!

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
