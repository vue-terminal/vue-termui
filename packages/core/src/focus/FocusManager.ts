import {
  ComponentInternalInstance,
  inject,
  InjectionKey,
  ShallowRef,
  shallowRef,
  unref,
} from '@vue/runtime-core'
import { nextSibling, previousSibling } from '../renderer/nodeOpts'
import { DOMElement, DOMNode, isDOMElement } from '../renderer/dom'
import {
  checkCurrentInstance,
  getElementFromInstance,
  noop,
  getVnodeFromInstance,
} from '../utils'
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
   * Focus a Focusable or remove the current focus by passing `null`.
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

  const focusNext: FocusManager['focusNext'] = () => {
    // the rootNode cannot be focused, so it's safe to start from there
    const startNode: DOMNode =
      getElementFromInstance(activeElement.value?._i) || rootNode
    let node: DOMNode | null = startNode
    // startNode === rootNode ? rootNode.childNodes[0] : nextSibling(startNode)

    do {
      node = nextDeepSibling(node, true)
      // we reached the end of the tree and we didn't start at the root node
      // so let's try going from the root
      if (!node && startNode !== rootNode && cyclic) {
        node = nextDeepSibling(rootNode, true)!
      }
    } while (
      node &&
      // we did a full loop
      node !== startNode &&
      // we skip any non focusable
      (!node.focusable ||
        // or disabled element
        node.focusable.disabled.value)
    )

    if (node && node.focusable) {
      return focus(unref(node.focusable.id))
    }
  }

  const focusPrevious: FocusManager['focusPrevious'] = () => {
    // the rootNode cannot be focused, so it's safe to start from there
    const lastNode = getLastNode(rootNode)
    const startNode: DOMNode =
      getElementFromInstance(activeElement.value?._i) || lastNode
    let node: DOMNode | null = startNode
    // startNode === rootNode ? rootNode.childNodes[0] : nextSibling(startNode)

    do {
      node = nextDeepSibling(node, false)
      // we reached the rootNode of the tree and we didn't start at the root node
      // so let's try going from the root
      if (!node && startNode !== lastNode && cyclic) {
        node = nextDeepSibling(lastNode, false)!
      }
    } while (
      node &&
      // we did a full loop
      node !== lastNode &&
      // we skip any non focusable
      (!node.focusable ||
        // or disabled element
        node.focusable.disabled.value)
    )

    if (node && node.focusable) {
      return focus(unref(node.focusable.id))
    }
  }

  const trapFocus: FocusManager['trapFocus'] = () => {
    // TODO:
    return noop
  }

  const _add: FocusManager['_add'] = (focusable) => {
    focusableMap.set(unref(focusable.id), focusable)
    const el = getElementFromInstance(focusable._i)
    if (!el) {
      throw new Error('NO VNODE wat')
    }
    el.focusable = focusable
  }
  const _remove: FocusManager['_remove'] = (focusable) => {
    const id = unref(focusable.id)
    const existingFocusable = focusableMap.get(id)
    if (existingFocusable) {
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

/**
 * Gets the next deep sibling. A DFS tree search. Returns `null` if we reached the root.
 *
 * @param node - node to start at
 */
function nextDeepSibling(node: DOMNode, forward: boolean): DOMNode | null {
  // check if the node has children
  if (forward && isDOMElement(node) && node.childNodes.length > 0) {
    return node.childNodes[0]
  } else {
    // get the next sibling based on the parent
    let nextNode = (forward ? nextSibling : previousSibling)(node)
    if (nextNode) return nextNode
    // no next sibling, find the closest parent next sibling
    nextNode = node.parentNode
    while (nextNode) {
      const sibling = (forward ? nextSibling : previousSibling)(nextNode)
      if (sibling) {
        return sibling
      }
      // try again with the parent
      nextNode = nextNode.parentNode
    }

    // we reached the root
    return null
  }
}

function getLastNode(node: DOMElement): DOMNode {
  let cursor: DOMNode = node
  while (isDOMElement(cursor) && cursor.childNodes.length > 0) {
    cursor = cursor.childNodes[cursor.childNodes.length - 1]
  }

  return cursor
}
