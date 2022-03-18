import { inject, onMounted, onUnmounted } from '@vue/runtime-core'
import { checkCurrentInstance, noop } from '../utils'
import { InputEventSetSymbol } from '../input/handling'
import { InputDataEventHandler } from '../input/types'
import { RemoveListener } from './keyboard'

export function onInputData(handler: InputDataEventHandler): RemoveListener {
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
