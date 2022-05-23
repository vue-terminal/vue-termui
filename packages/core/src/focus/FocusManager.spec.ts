import { createFocusManager } from './FocusManager'
import { DOMElement, DOMNode, TextNode, CommentNode } from '../renderer/dom'
import {
  ComponentInternalInstance,
  VNode,
  ref,
  ComputedRef,
  h,
} from '@vue/runtime-core'
import { Focusable } from './types'

/**
 * create internal instance
 * @param el
 * @returns
 */
function focusable(
  _el: DOMNode | string,
  options: Partial<Focusable> | false = {}
): ComponentInternalInstance {
  const el = typeof _el === 'string' ? new TextNode(_el) : _el
  const vnode = { el } as VNode<DOMNode, DOMElement>
  // @ts-expect-error: we only need the el for focus
  const instance = { vnode } as ComponentInternalInstance

  el.focusable =
    options === false
      ? null
      : {
          active: ref(false) as ComputedRef<boolean>,
          disabled: ref(false),
          id: Symbol(),
          _i: instance,
          ...options,
        }

  return instance
}

focusable(new TextNode('a'))
focusable('a')

interface DOMTree extends Array<DOMTree | DOMNode | string> {}

function createFocusableTree(
  tree: DOMTree,
  parent: DOMElement = new DOMElement('tui:root')
) {
  tree.forEach((node) => {
    if (Array.isArray(node)) {
      parent.insertNode(createFocusableTree(node, new DOMElement('tui:box')))
    } else {
      const ci = focusable(node)
      parent.insertNode(ci.vnode.el as DOMNode)
    }
  })

  return parent
}

describe('FocusManager', () => {
  it('creates a focus manager', () => {
    const root = createFocusableTree([])
    const fm = createFocusManager(root)

    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusNext()).toBeFalsy()
    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusPrevious()).toBeFalsy()
    expect(fm.activeElement.value).toBeNull()
  })

  it('loops through one single item with next', () => {
    const root = createFocusableTree(['1'])
    const fm = createFocusManager(root)

    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusNext()).toBeFalsy()
    expect(fm.activeElement.value).toBeNull()
    expect(fm.focusPrevious()).toBeFalsy()
    expect(fm.activeElement.value).toBeNull()
  })
})
