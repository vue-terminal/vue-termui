import {
  computed,
  onUnmounted,
  ref,
  watch,
  isRef,
  getCurrentInstance,
  unref,
  onMounted,
} from '@vue/runtime-core'
import type { WritableComputedRef } from '@vue/runtime-core'
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
  disabled?: MaybeRef<boolean>

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
}: FocusableOptions = {}): Focusable & {
  isFocus: WritableComputedRef<boolean>
} {
  if (!checkCurrentInstance('useFocus')) {
    throw new Error('Cannot create a focusable without an instance')
  }

  const instance = getCurrentInstance()!

  const { activeElement, _add, _remove, focus, _changeFocusableId } =
    useFocusManager()

  const id: MaybeRef<FocusId> = idSource ? ref(idSource) : Symbol()

  const active = computed<boolean>(() => activeElement.value === focusable)

  const disabled = ref(
    isRef(startsDisabled) ? startsDisabled : !!startsDisabled
  )
  watch(disabled, (disabled) => {
    if (disabled && active.value) {
      focus(null)
    }
  })

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
  onUnmounted(() => {
    _remove(focusable)
    // this is okay because the focusable is being destroyed
    // @ts-expect-error: avoid cyclic references
    focusable._i = null
  })

  return {
    ...focusable,
    isFocus: computed<boolean>({
      get() {
        return active.value
      },
      set(value) {
        focus(value ? unref(id) : null)
      },
    }),
  }
}
