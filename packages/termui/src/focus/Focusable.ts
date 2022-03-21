import {
  computed,
  customRef,
  getCurrentInstance,
  ref,
  Ref,
  VNode,
} from '@vue/runtime-core'
import { MaybeRef } from '../utils'
import { DOMElement, DOMNode } from '../renderer/dom'
import { Focusable, FocusId } from './types'

export interface FocusableOptions {
  /**
   * Is initially active. Defaults to `true`.
   */
  active?: boolean

  /**
   * Is initially disabled. Defaults to `false`.
   */
  disabled?: boolean
  id?: MaybeRef<FocusId | null>
}

export function createFocusable({
  active: startsActive = true,
  disabled: startsDisabled,
  id: idSource,
}: FocusableOptions = {}): Focusable {
  const instance = getCurrentInstance()
  if (instance) {
    const vnode = instance.vnode as VNode<DOMNode, DOMElement>
    instance.vnode.shapeFlag
  }

  const active = computed<boolean>({
    get() {
      return false
    },
    set(active) {},
  })

  const disabled = customRef<boolean>((track, trigger) => ({
    get() {
      track()
      return false
    },
    set(disabled) {
      trigger()
    },
  }))

  const id = ref(idSource ?? null)

  return {
    disabled,
    id,
    active,
  }
}
