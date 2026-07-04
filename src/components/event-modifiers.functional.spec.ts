// @vitest-environment node
//
// Functional tests for event-listener modifiers. These deliberately know
// *nothing* about how modifiers are implemented: they compile a real
// `@keyDown.ctrl.c` template through the library's own compiler pipeline, mount
// it with the real custom renderer, and drive real keyboard/mouse input through
// OpenTUI (`mockInput`/`mockMouse`, which parse actual escape sequences). The
// assertions are purely behavioral — "handler fired / didn't" — so they hold for
// any implementation (the compiler transform today, DOM-shaped events tomorrow).
//
// The ONLY implementation-tracking line is the compiler config in `compileRender`
// (`nodeTransforms`); everything else is the shipping behavior.
import { SyntaxStyle } from '@opentui/core'
import { MouseButtons } from '@opentui/core/testing'
import { compile } from '@vue/compiler-dom'
import * as RuntimeCore from '@vue/runtime-core'
import { createRenderer, defineComponent, h, nextTick } from '@vue/runtime-core'
import { withKeys, withModifiers } from '@vue/runtime-dom'
import { createTestRenderer } from '@opentui/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { encodeEventModifiers } from '../vite'
import { Box } from './Box'
import { Input } from './Input'
import { Markdown } from './Markdown'
import { Select } from './Select'
import { Text } from './Text'
import { Textarea } from './Textarea'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

// The compiled render function pulls helpers off a `Vue` object: vnode helpers
// come from the same `@vue/runtime-core` the renderer uses, and the DOM guard
// helpers (`withKeys`/`withModifiers`) from `@vue/runtime-dom`.
const VUE_HELPERS = { ...RuntimeCore, withKeys, withModifiers }
const HOST_TAGS = new Set(['box', 'text', 'input', 'textarea', 'select', 'markdown'])

// Compile a template the way the library's Vite plugin does.
function compileRender(template: string): (...args: unknown[]) => unknown {
  const { code } = compile(template, {
    mode: 'function',
    hoistStatic: false,
    cacheHandlers: false,
    isCustomElement: (tag) => HOST_TAGS.has(tag),
    nodeTransforms: [encodeEventModifiers],
  })
  return new Function('Vue', code)(VUE_HELPERS) as (...args: unknown[]) => unknown
}

describe('event modifiers (functional)', () => {
  let test: TestRendererSetup

  beforeEach(async () => {
    // Kitty keyboard protocol so modifiers (Shift on letters, etc.) are reported
    // faithfully — legacy terminals fold Shift into the character and can't
    // express chords like Ctrl+Shift+A, which `.exact` needs to observe.
    test = await createTestRenderer({ width: 40, height: 10, kittyKeyboard: true })
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  // Mount a template with the given handler state and return the first renderable.
  async function mount(template: string, state: Record<string, unknown>): Promise<Renderable> {
    const render = createRenderer(createNodeOps(test.renderer)).render
    const Root = defineComponent({
      components: { Box },
      setup: () => state,
      render: compileRender(template),
    })
    render(h(Root), test.renderer.root)
    await nextTick()
    await test.renderOnce()
    return test.renderer.root.getChildren()[0] as Renderable
  }

  describe('keyboard', () => {
    it('@keyDown.ctrl.c fires only on Ctrl+C', async () => {
      const onCtrlC = vi.fn()
      const el = await mount('<Box focusable @keyDown.ctrl.c="onCtrlC" />', { onCtrlC })
      el.focus()

      test.mockInput.pressKey('c')
      expect(onCtrlC).toHaveBeenCalledTimes(0)

      test.mockInput.pressKey('x', { ctrl: true })
      expect(onCtrlC).toHaveBeenCalledTimes(0)

      test.mockInput.pressKey('c', { ctrl: true })
      expect(onCtrlC).toHaveBeenCalledTimes(1)
    })

    it('@keyDown.enter fires on Enter', async () => {
      const onEnter = vi.fn()
      const el = await mount('<Box focusable @keyDown.enter="onEnter" />', { onEnter })
      el.focus()

      test.mockInput.pressKey('a')
      expect(onEnter).toHaveBeenCalledTimes(0)

      test.mockInput.pressEnter()
      expect(onEnter).toHaveBeenCalledTimes(1)
    })

    it('@keyDown.ctrl.exact fires only when Ctrl is the sole modifier', async () => {
      const onExact = vi.fn()
      const el = await mount('<Box focusable @keyDown.ctrl.exact="onExact" />', { onExact })
      el.focus()

      test.mockInput.pressKey('a', { ctrl: true, shift: true })
      expect(onExact).toHaveBeenCalledTimes(0)

      test.mockInput.pressKey('a', { ctrl: true })
      expect(onExact).toHaveBeenCalledTimes(1)
    })

    it('@keyDown.esc maps the alias to the Escape key', async () => {
      const onEsc = vi.fn()
      const el = await mount('<Box focusable @keyDown.esc="onEsc" />', { onEsc })
      el.focus()

      test.mockInput.pressKey('a')
      expect(onEsc).toHaveBeenCalledTimes(0)

      test.mockInput.pressEscape()
      expect(onEsc).toHaveBeenCalledTimes(1)
    })

    it('@keyDown.enter.esc matches either key name', async () => {
      const onEither = vi.fn()
      const el = await mount('<Box focusable @keyDown.enter.esc="onEither" />', { onEither })
      el.focus()

      test.mockInput.pressEnter()
      test.mockInput.pressEscape()
      test.mockInput.pressKey('a')
      expect(onEither).toHaveBeenCalledTimes(2)
    })

    it('@keyDown.ctrl.shift.k requires the full chord', async () => {
      const onChord = vi.fn()
      const el = await mount('<Box focusable @keyDown.ctrl.shift.k="onChord" />', { onChord })
      el.focus()

      test.mockInput.pressKey('k', { ctrl: true })
      expect(onChord).toHaveBeenCalledTimes(0)

      test.mockInput.pressKey('k', { ctrl: true, shift: true })
      expect(onChord).toHaveBeenCalledTimes(1)
    })

    it('a plain @keyDown fires for every key', async () => {
      const onKey = vi.fn()
      const el = await mount('<Box focusable @keyDown="onKey" />', { onKey })
      el.focus()

      test.mockInput.pressKey('a')
      test.mockInput.pressKey('b', { ctrl: true })
      expect(onKey).toHaveBeenCalledTimes(2)
    })
  })

  describe('mouse', () => {
    it('@mouseDown.right fires only for the right button', async () => {
      const onRight = vi.fn()
      await mount('<Box :width="20" :height="4" @mouseDown.right="onRight" />', { onRight })

      await test.mockMouse.click(2, 1, MouseButtons.LEFT)
      expect(onRight).toHaveBeenCalledTimes(0)

      await test.mockMouse.click(2, 1, MouseButtons.RIGHT)
      expect(onRight).toHaveBeenCalledTimes(1)
    })

    it('@mouseDown.middle fires only for the middle button', async () => {
      const onMiddle = vi.fn()
      await mount('<Box :width="20" :height="4" @mouseDown.middle="onMiddle" />', { onMiddle })

      await test.mockMouse.click(2, 1, MouseButtons.LEFT)
      expect(onMiddle).toHaveBeenCalledTimes(0)

      await test.mockMouse.click(2, 1, MouseButtons.MIDDLE)
      expect(onMiddle).toHaveBeenCalledTimes(1)
    })

    it('separates @mouseDown.left.exact from @mouseDown.shift', async () => {
      const onPlain = vi.fn()
      const onShift = vi.fn()
      await mount(
        '<Box :width="20" :height="4" @mouseDown.left.exact="onPlain" @mouseDown.shift="onShift" />',
        { onPlain, onShift },
      )

      await test.mockMouse.click(2, 1, MouseButtons.LEFT)
      expect(onPlain).toHaveBeenCalledTimes(1)
      expect(onShift).toHaveBeenCalledTimes(0)

      await test.mockMouse.click(2, 1, MouseButtons.LEFT, { modifiers: { shift: true } })
      expect(onShift).toHaveBeenCalledTimes(1)
      // exact rejects the extra Shift modifier
      expect(onPlain).toHaveBeenCalledTimes(1)
    })

    it('.stop keeps a child click from reaching the parent handler', async () => {
      const onOuter = vi.fn()
      const onInner = vi.fn()
      await mount(
        `<Box :width="20" :height="6" @mouseDown="onOuter">
           <Box :width="6" :height="2" @mouseDown.stop="onInner" />
         </Box>`,
        { onOuter, onInner },
      )

      // Click inside the inner box: it handles and stops propagation.
      await test.mockMouse.click(1, 1, MouseButtons.LEFT)
      expect(onInner).toHaveBeenCalledTimes(1)
      expect(onOuter).toHaveBeenCalledTimes(0)

      // Click the outer box away from the inner one: only the outer fires.
      await test.mockMouse.click(15, 5, MouseButtons.LEFT)
      expect(onOuter).toHaveBeenCalledTimes(1)
    })
  })
})

// Every renderable-backed component must forward its listeners to the underlying
// renderable. This is component wiring, not modifier logic, so it uses a plain
// `onKeyDown` (stable public API in any implementation) and a real keypress.
describe('renderable components forward key events', () => {
  let test: TestRendererSetup
  // Markdown needs a real syntax style; built once a renderer exists.
  let syntaxStyle: SyntaxStyle

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10, kittyKeyboard: true })
    syntaxStyle = SyntaxStyle.fromStyles({ default: { fg: '#e6edf3' } })
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  const cases: Array<{ name: string; vnode: (onKeyDown: () => void) => VNode }> = [
    { name: 'Box', vnode: (onKeyDown) => h(Box, { focusable: true, onKeyDown }) },
    { name: 'Text', vnode: (onKeyDown) => h(Text, { focusable: true, onKeyDown }, () => 'x') },
    { name: 'Input', vnode: (onKeyDown) => h(Input, { modelValue: '', onKeyDown }) },
    { name: 'Textarea', vnode: (onKeyDown) => h(Textarea, { modelValue: '', onKeyDown }) },
    {
      name: 'Select',
      vnode: (onKeyDown) => h(Select, { options: [{ name: 'One' }], modelValue: 0, onKeyDown }),
    },
    {
      name: 'Markdown',
      vnode: (onKeyDown) => h(Markdown, { content: 'x', syntaxStyle, focusable: true, onKeyDown }),
    },
  ]

  it.each(cases)('$name delivers a keypress to onKeyDown', async ({ vnode }) => {
    const onKeyDown = vi.fn()
    const render = createRenderer(createNodeOps(test.renderer)).render
    render(h(defineComponent({ setup: () => () => vnode(onKeyDown) })), test.renderer.root)
    await nextTick()
    await test.renderOnce()

    const el = test.renderer.root.getChildren()[0] as Renderable
    el.focus()
    test.mockInput.pressKey('a')

    expect(onKeyDown).toHaveBeenCalledTimes(1)
  })
})
