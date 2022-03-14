import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { checkCurrentInstance, noop } from '../utils'
import { MouseEventMapSymbol } from '../input/handling'
import { MouseEventType, MouseEventHandler } from '../input/types'
import { RemoveListener } from './keyboard'

export function onMouseEvent(
  type: MouseEventType,
  handler: MouseEventHandler
): RemoveListener
export function onMouseEvent(handler: MouseEventHandler): RemoveListener
export function onMouseEvent(
  typeOrHandler: MouseEventType | MouseEventHandler,
  handler?: MouseEventHandler
): RemoveListener {
  if (!checkCurrentInstance('onInput')) return noop

  const mouseEventMap = inject(MouseEventMapSymbol)!

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
