import { ComponentInternalInstance, ComputedRef, Ref } from '@vue/runtime-core'
import { MaybeRef } from '../utils'

export interface Focusable {
  active: ComputedRef<boolean>
  disabled: Ref<boolean>
  id: MaybeRef<FocusId>

  /**
   * Instance attached to the focusable
   * @internal
   */
  _i: ComponentInternalInstance
}

/**
 * Types for the `id` of a Focusable element.
 */
export type FocusId = string | symbol
