import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { checkCurrentInstance, noop } from '../utils'
import { MouseEventMapSymbol } from '../input/handling'
import { MouseEventType, MouseDataEventHandler } from '../input/types'
import { RemoveListener } from './keyboard'

export function onMouseData(
  type: MouseEventType,
  handler: MouseDataEventHandler
): RemoveListener
export function onMouseData(handler: MouseDataEventHandler): RemoveListener
export function onMouseData(
  typeOrHandler: MouseEventType | MouseDataEventHandler,
  handler?: MouseDataEventHandler
): RemoveListener {
  if (!checkCurrentInstance('onInput')) return noop

  const mouseEventMap = inject(MouseEventMapSymbol)!

  const type: MouseEventType =
    typeof typeOrHandler !== 'function' ? typeOrHandler : MouseEventType.any

  handler = handler || (typeOrHandler as MouseDataEventHandler)

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
