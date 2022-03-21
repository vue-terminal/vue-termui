import {
  computed,
  customRef,
  onUnmounted,
  ref,
  watch,
  isRef,
  getCurrentInstance,
  unref,
  onMounted,
} from '@vue/runtime-core'
import { checkCurrentInstance, MaybeRef } from '../utils'
import { Focusable, FocusId } from './types'
import { useFocusManager } from './FocusManager'

export interface FocusableOptions {
  /**
   * Is initially active. Defaults to `false`. Use `FocusManager.focus()` to focus a specific element.
   */
  active?: boolean

  /**
   * Is initially disabled. Defaults to `false` and can be changed.
   */
  disabled?: boolean

  /**
   * Unique `id` for the focusable element. Can be a `string` or a `symbol`. If none is provided, a `symbol` will be
   * created.
   */
  id?: MaybeRef<FocusId>
}

export function useFocus({
  active: startsActive,
  disabled: startsDisabled,
  id: idSource,
}: FocusableOptions = {}): Focusable {
  if (!checkCurrentInstance('useFocus')) {
    throw new Error('Cannot create a focusable without an instance')
  }

  const instance = getCurrentInstance()!

  const { activeElement, _add, _remove, focus, _changeFocusableId } =
    useFocusManager()

  const id: MaybeRef<FocusId> = idSource ? ref(idSource) : Symbol()

  const active = computed<boolean>(() => activeElement.value === focusable)

  let internalDisabled = !!startsDisabled
  const disabled = customRef<boolean>((track, trigger) => ({
    get() {
      track()
      return internalDisabled
    },
    set(disabled) {
      internalDisabled = disabled
      if (disabled && active.value) {
        focus(null)
      }
      trigger()
    },
  }))

  const focusable: Focusable = {
    disabled,
    id,
    active,
    _i: instance,
  }

  onMounted(() => {
    // handle the creation and removal of the focusable
    _add(focusable)
    // if the id can be changed, we need to adapt the internal map
    if (isRef(id)) {
      watch(id, _changeFocusableId)
    }

    // ensures active starts with the right value
    if (startsActive) {
      focus(unref(id))
    }
  })
  onUnmounted(() => _remove(focusable))

  return focusable
}
