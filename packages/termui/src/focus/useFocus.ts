import { getCurrentInstance, Ref, VNode } from '@vue/runtime-core'
import { DOMElement, DOMNode } from '../dom'

interface UseFocusOptions {
  disabled: Ref<boolean>
  id?: string | symbol
}

export function useFocus() {
  const instance = getCurrentInstance()
  if (instance) {
    const vnode = instance.vnode as VNode<DOMNode, DOMElement>
    instance.vnode.shapeFlag
  }
}
