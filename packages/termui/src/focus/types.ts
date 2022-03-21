import { Ref } from '@vue/runtime-core'

export interface Focusable {
  active: Ref<boolean>
  disabled: Ref<boolean>
  id: Ref<FocusId | null>
}

export type FocusId = string | symbol
