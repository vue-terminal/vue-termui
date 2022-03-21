import { ComponentInternalInstance } from '@vue/runtime-core'
import { noop } from '../utils'
import { Focusable, FocusId } from './types'

export interface FocusManager {
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
   * Traps the focus within the current component tree until it is is deactivated
   */
  trapFocus(options?: FocusTrapOptions): () => void
}

/**
 * TODO: use focus trap as an inspiration
 */
export interface FocusTrapOptions {
  restoreOnExit?: boolean
}

export function createFocusManager(): FocusManager {
  function focus(id: FocusId) {
    return null
  }

  function focusNext() {
    return null
  }
  function focusPrevious() {
    return null
  }

  function trapFocus() {
    return noop
  }

  function _add(instance: any) {
    // instance.$focusContext = {}
  }

  function _remove(instance: Focusable) {}

  return {
    _add,
    _remove,

    focus,
    focusNext,
    focusPrevious,
    trapFocus,
  }
}

declare module '@vue/runtime-core' {}
