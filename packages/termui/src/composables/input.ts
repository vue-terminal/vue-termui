import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { checkCurrentInstance, noop } from '../utils'
import { InputEventSetSymbol } from '../input/handling'
import { InputEventHandler } from '../input/types'
import { RemoveListener } from './keyboard'

export function onInput(handler: InputEventHandler): RemoveListener {
  if (!checkCurrentInstance('onInput')) return noop

  const inputEventSet = inject(InputEventSetSymbol)!

  onMounted(() => {
    inputEventSet.add(handler)
  })
  const removeListener = () => {
    inputEventSet.delete(handler)
  }
  onUnmounted(removeListener)

  return removeListener
}
