import {
  inject,
  InjectionKey,
  ShallowRef,
  shallowRef,
  unref,
} from '@vue/runtime-core'
import {
  getLastLeaf,
  previousDeepSibling,
  nextDeepSibling,
} from '../renderer/nodeOpts'
import { DOMElement, DOMNode } from '../renderer/dom'
import { checkCurrentInstance, getElementFromInstance, noop } from '../utils'
import { Focusable, FocusId } from './types'

export interface FocusManager {
  activeElement: ShallowRef<Focusable | null | undefined>

  /**
   * @internal
   */
  _add(focusable: Focusable): void
  /**
   * @internal
   */
  _remove(focusable: Focusable): void

  _changeFocusableId(newId: FocusId, oldId: FocusId): void

  /**
   * Focus a Focusable or remove the current focus by passing `null`. Returns the currently Focusable or null otherwise.
   *
   * @param id - id of the focusable
   */
  focus(id: FocusId | null): Focusable | null | undefined
  focusNext(): Focusable | null | undefined
  focusPrevious(): Focusable | null | undefined

  /**
   * Traps the focus within the current component tree until it is is deactivated.
   * TODO: should it return trap controls?
   * TODO: createFocusTrap() ?
   */
  trapFocus(options?: FocusTrapOptions): () => void
}

/**
 * TODO: use focus trap as an inspiration
 */
export interface FocusTrapOptions {
  restoreOnExit?: boolean
}

export const FocusManagerSymbol = Symbol(
  'vue-termui:FocusManager'
) as InjectionKey<FocusManager>

/**
 * Returns the FocusManager associated with the current running app. Note this must be invoked within an active context,
 * e.g. inside `setup()`.
 * @returns - the Focus Manager
 */
export function useFocusManager(): FocusManager {
  if (!checkCurrentInstance('useFocusManager')) {
    throw new Error('No FocusManager')
  }

  return inject(FocusManagerSymbol)!
}

export interface FocusManagerOptions {
  /**
   * Loop through all possible options when reading the end. Defaults to `true`.
   */
  cyclic?: boolean
}

export function createFocusManager(
  rootNode: DOMElement,
  { cyclic = true }: FocusManagerOptions = {}
): FocusManager {
  const activeElement = shallowRef<Focusable | null | undefined>(null)
  const focusableMap = new Map<FocusId, Focusable>()

  const focus: FocusManager['focus'] = (id) => {
    if (id == null) {
      return (activeElement.value = null)
    } else {
      const focusable = focusableMap.get(id)
      if (!focusable || focusable.disabled.value) {
        return null
      }
      return (activeElement.value = focusable)
    }
  }

  const focusPrevious: FocusManager['focusPrevious'] = () => {
    const lastNode = getLastLeaf(rootNode)
    const activeNode = getElementFromInstance(activeElement.value?._i)
    let startNode = activeNode
    let cursor: DOMNode | null | undefined = activeNode

    do {
      // get the previous deep node or the very last node
      cursor = (cursor && previousDeepSibling(cursor)) || lastNode

      // cursor cannot be empty but startNode can
      if (cursor === startNode) {
        break
      }
      // it is safe to set the starter node to the lastNode now
      // so we can detect full loops
      startNode = startNode || lastNode
    } while (
      cursor &&
      // we skip any non focusable
      (!cursor.focusable ||
        // or disabled element
        cursor.focusable.disabled.value)
    )

    if (cursor.focusable) {
      return focus(unref(cursor.focusable.id))
    }
  }

  const focusNext: FocusManager['focusNext'] = () => {
    const firstNode = rootNode
    const activeNode = getElementFromInstance(activeElement.value?._i)
    let startNode = activeNode
    let cursor: DOMNode | null | undefined = activeNode

    do {
      // get the next deep node or the very first node (the root)
      cursor = (cursor && nextDeepSibling(cursor)) || firstNode

      // cursor cannot be empty but startNode can
      if (cursor === startNode) {
        break
      }
      // it is safe to set the starter node to the lastNode now
      // so we can detect full loops
      startNode = startNode || firstNode
    } while (
      cursor &&
      // we skip any non focusable
      (!cursor.focusable ||
        // or disabled element
        cursor.focusable.disabled.value)
    )

    if (cursor.focusable) {
      return focus(unref(cursor.focusable.id))
    }
  }

  const trapFocus: FocusManager['trapFocus'] = () => {
    // TODO:
    return noop
  }

  const _add: FocusManager['_add'] = (focusable) => {
    focusableMap.set(unref(focusable.id), focusable)
    const el = getElementFromInstance(focusable._i)
    // TODO: can el be an array? If so, should we error and allow only single element root?
    if (!el) {
      throw new Error('NO VNODE wat')
    }
    el.focusable = focusable
  }
  const _remove: FocusManager['_remove'] = (focusable) => {
    const id = unref(focusable.id)
    const existingFocusable = focusableMap.get(id)
    if (existingFocusable) {
      // remove the cyclic referenc
      const el = getElementFromInstance(focusable._i)
      if (el) {
        el.focusable = null
      }

      focusableMap.delete(id)
      // if the focusable being removed is focused, remove focus
      if (activeElement.value === existingFocusable) {
        activeElement.value = null
      }
    }
  }

  const _changeFocusableId: FocusManager['_changeFocusableId'] = (
    newId,
    oldId
  ) => {
    const focusable = focusableMap.get(oldId)
    if (!focusable) return
    focusableMap.delete(oldId)
    focusableMap.set(newId, focusable)
  }

  return {
    activeElement,

    _add,
    _remove,
    _changeFocusableId,

    focus,
    focusNext,
    focusPrevious,
    trapFocus,
  }
}
