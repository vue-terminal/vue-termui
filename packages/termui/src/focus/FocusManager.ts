import {
  ComponentInternalInstance,
  InjectionKey,
  ShallowRef,
  shallowRef,
} from '@vue/runtime-core'
import { noop } from '../utils'
import { Focusable, FocusId } from './types'

export interface FocusManager {
  activeElement: ShallowRef<Focusable | null>

  /**
   * @internal
   */
  _add(instance: Focusable): void
  /**
   * @internal
   */
  _remove(instance: Focusable): void

  focus(id: FocusId): Focusable | null
  focusNext(): Focusable | null
  focusPrevious(): Focusable | null

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

export function createFocusManager(): FocusManager {
  const activeElement = shallowRef<Focusable | null>(null)

  const focus: FocusManager['focus'] = (id) => {
    return null
  }

  const focusNext: FocusManager['focusNext'] = () => {
    return null
  }
  const focusPrevious: FocusManager['focusPrevious'] = () => {
    return null
  }

  const trapFocus: FocusManager['trapFocus'] = () => {
    return noop
  }

  const _add: FocusManager['_add'] = (instance) => {}
  const _remove: FocusManager['_remove'] = (instance) => {}

  return {
    activeElement,

    _add,
    _remove,

    focus,
    focusNext,
    focusPrevious,
    trapFocus,
  }
}

declare module '@vue/runtime-core' {}
