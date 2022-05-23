import {
  getCurrentInstance,
  Ref,
  ComponentInternalInstance,
  VNode,
} from '@vue/runtime-core'
import { DOMElement, DOMNode } from '../renderer/dom'

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null)
  return ((str: string) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }) as any
}

const camelizeRE = /-(\w)/g
/**
 * @private
 */
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})

const hyphenateRE = /\B([A-Z])/g
/**
 * @private
 */
export const hyphenate = cacheStringFunction((str: string) =>
  str.replace(hyphenateRE, '-$1').toLowerCase()
)

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint

export type LiteralUnion<LiteralType, BaseType extends Primitive> =
  | LiteralType
  | (BaseType & Record<never, never>)

/**
 * Warns if the current function is called wrong. To be used with functions that require using inject. Returns `true` if
 * the check is successful, `false` otherwise.
 *
 * @param fnName - name of the function being called
 */
export function checkCurrentInstance(fnName: string) {
  const instance = getCurrentInstance()

  if (!instance) {
    console.warn(`[Vue TermUI]: "${fnName}()" must be called inside "setup()".`)
  }
  return !!instance
}

export const noop = () => {}

export type MaybeRef<T> = Ref<T> | T

export function getVnodeFromInstance(instance: ComponentInternalInstance) {
  return instance.vnode as VNode<DOMNode, DOMElement> | undefined
}

export function getElementFromInstance(
  instance: ComponentInternalInstance | undefined | null
): DOMNode | null | undefined {
  return (instance?.vnode as VNode<DOMNode, DOMElement> | undefined)?.el
}
