import { Ref } from '@vue/runtime-core'

export interface Focusable {
  active: Ref<boolean>
  disabled: Ref<boolean>
  id: Ref<FocusId | null>
}

/**
 * Types for the `id` of a Focusable element.
 */
export type FocusId = string | symbol
