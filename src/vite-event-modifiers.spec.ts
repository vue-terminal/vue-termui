// @vitest-environment node
import { compile } from '@vue/compiler-dom'
import { describe, expect, it } from 'vitest'
import { encodeEventModifiers } from './vite'

// Compile a template the way `vueTermui`'s plugin does: the terminal host tags
// are custom elements and our transform runs before Vue's built-in `on` handling.
function render(template: string): string {
  return compile(template, {
    isCustomElement: (tag) => ['box', 'text', 'input', 'select', 'textarea'].includes(tag),
    nodeTransforms: [encodeEventModifiers],
  }).code
}

describe('encodeEventModifiers', () => {
  it('folds key-event modifiers into the listener prop name, unwrapped', () => {
    const code = render('<Box @keyDown.ctrl.c="h" />')
    expect(code).toContain('onKeyDown__ctrl__c')
    // Crucially, no DOM-only guards that would misread OpenTUI events.
    expect(code).not.toContain('withKeys')
    expect(code).not.toContain('withModifiers')
  })

  it('encodes a lone key-name modifier', () => {
    expect(render('<Box @keyDown.enter="h" />')).toContain('onKeyDown__enter')
  })

  it('encodes mouse-event modifiers (flow + button)', () => {
    const code = render('<Box @mouseDown.stop.left="h" />')
    expect(code).toContain('onMouseDown__stop__left')
    expect(code).not.toContain('withModifiers')
  })

  it('leaves plain listeners with no modifiers untouched', () => {
    const code = render('<Box @keyDown="h" />')
    expect(code).toContain('onKeyDown')
    expect(code).not.toContain('__')
  })

  it('does not touch non-input events, so component-emit modifiers still work', () => {
    // `.once` on a component emit is Vue's own concern — it must not be encoded.
    const code = render('<Box @focus.once="h" />')
    expect(code).not.toContain('onFocus__once')
    expect(code).toContain('onFocusOnce')
  })

  it('ignores dynamic event names', () => {
    const code = render('<Box @[evt].ctrl="h" />')
    expect(code).not.toContain('__')
  })
})
