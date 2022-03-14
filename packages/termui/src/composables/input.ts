import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { checkCurrentInstance, noop } from '../utils'
import { MouseEventMapSymbol, KeyEventMapSymbol } from '../input/handling'
import { MouseEvent, KeypressEvent, MouseEventType } from '../input/types'
import { RemoveListener } from './keyboard'

export interface InputHandler {
  (event: MouseEvent | KeypressEvent): void
}

export function onInput(handler: InputHandler): RemoveListener {
  if (!checkCurrentInstance('onInput')) return noop

  const mouseEventMap = inject(MouseEventMapSymbol)!
  const keyEventMap = inject(KeyEventMapSymbol)!

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
