// @vitest-environment node
import { createRenderer } from '@vue/runtime-core'
import { SyntaxStyle } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNodeOps } from './nodeOps'
import { mockConsoleError, mockConsoleWarn } from '../__tests__/mock-console'
import type { BoxRenderable, MarkdownRenderable, TextRenderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('nodeOps', () => {
  mockConsoleWarn()
  mockConsoleError()

  let test: TestRendererSetup

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10 })
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders a box containing text', async () => {
    const { render } = createRenderer(createNodeOps(test.renderer))

    const App = defineComponent({
      setup() {
        return () => h('tui-box', null, [h('tui-text', null, 'Hello vue-termui')])
      },
    })

    render(h(App), test.renderer.root)
    await test.renderOnce()

    expect(test.captureCharFrame()).toContain('Hello vue-termui')
  })

  it('re-renders when a reactive ref changes', async () => {
    const { render } = createRenderer(createNodeOps(test.renderer))
    const label = ref('first')

    const App = defineComponent({
      setup() {
        return () => h('tui-box', null, [h('tui-text', null, label.value)])
      },
    })

    render(h(App), test.renderer.root)
    await test.renderOnce()
    expect(test.captureCharFrame()).toContain('first')

    label.value = 'second'
    await nextTick()
    await test.renderOnce()

    const frame = test.captureCharFrame()
    expect(frame).toContain('second')
    expect(frame).not.toContain('first')
  })

  it('ignores a nested text and reports it (non-production) instead of crashing', async () => {
    // The guard is gated on `process.env.NODE_ENV !== 'production'`, which holds
    // under the test runner, so no flag setup is needed here. It is compiled out
    // of an app's production build (verified by the build/grep, not a unit test).
    const { render } = createRenderer(createNodeOps(test.renderer))

    // OpenTUI text can't hold a nested text block; the renderer drops the inner
    // one (keeping the surrounding content) and points at the `content` prop.
    const App = defineComponent({
      setup() {
        return () =>
          h('tui-box', null, [
            h('tui-text', null, ['Press ', h('tui-text', null, 'q'), ' to quit']),
          ])
      },
    })

    render(h(App), test.renderer.root)
    await test.renderOnce()

    const frame = test.captureCharFrame()
    expect(frame).toContain('Press ')
    expect(frame).toContain(' to quit')
    expect('<Text> cannot be nested inside another <Text>').toHaveBeenErrored()
  })

  it('warns when setText targets a non-text node', () => {
    const nodeOps = createNodeOps(test.renderer)
    const box = nodeOps.createElement('tui-box', undefined, undefined, undefined)

    nodeOps.setText(box, 'nope')

    expect('[vue-termui] setText called on non-text node').toHaveBeenWarned()
  })

  it('warns when setElementText targets a non-text node', () => {
    const nodeOps = createNodeOps(test.renderer)
    const box = nodeOps.createElement('tui-box', undefined, undefined, undefined)

    nodeOps.setElementText(box, 'nope')

    expect('[vue-termui] setElementText called on non-text node').toHaveBeenWarned()
  })

  describe('patchProp reset to default', () => {
    it('restores the pristine value when a prop is patched to undefined', () => {
      const nodeOps = createNodeOps(test.renderer)
      const box = nodeOps.createElement('tui-box', undefined, undefined, undefined) as BoxRenderable

      nodeOps.patchProp(box, 'border', null, true)
      expect(box.border).toBe(true)

      nodeOps.patchProp(box, 'border', true, undefined)
      expect(box.border).toBe(false)
    })

    it('restores the pristine value when a prop is patched to null', () => {
      // `overflow`'s setter silently ignores nullish values, so without the
      // restore the last value would stick forever
      const nodeOps = createNodeOps(test.renderer)
      const box = nodeOps.createElement('tui-box', undefined, undefined, undefined) as BoxRenderable

      nodeOps.patchProp(box, 'overflow', null, 'hidden')
      expect(box.overflow).toBe('hidden')

      nodeOps.patchProp(box, 'overflow', 'hidden', null)
      expect(box.overflow).toBe('visible')
    })

    it('restores defaults across elements of the same class', () => {
      const nodeOps = createNodeOps(test.renderer)
      const a = nodeOps.createElement('tui-text', undefined, undefined, undefined) as TextRenderable
      const b = nodeOps.createElement('tui-text', undefined, undefined, undefined) as TextRenderable

      nodeOps.patchProp(a, 'attributes', null, 1)
      nodeOps.patchProp(b, 'attributes', null, 2)
      nodeOps.patchProp(a, 'attributes', 1, undefined)
      nodeOps.patchProp(b, 'attributes', 2, undefined)

      expect(a.attributes).toBe(0)
      expect(b.attributes).toBe(0)
    })

    it('restores defaults on <tui-markdown>, whose renderable needs a syntaxStyle to construct', () => {
      const nodeOps = createNodeOps(test.renderer)
      const syntaxStyle = SyntaxStyle.fromStyles({ default: { fg: '#ffffff' } })
      const md = nodeOps.createElement('tui-markdown', undefined, undefined, {
        syntaxStyle,
      }) as MarkdownRenderable

      nodeOps.patchProp(md, 'content', null, '# hi')
      expect(md.content).toBe('# hi')

      nodeOps.patchProp(md, 'content', '# hi', undefined)
      expect(md.content).toBe('')
      expect(md.syntaxStyle).toBe(syntaxStyle)
    })

    it('clears event handlers instead of restoring them', () => {
      const nodeOps = createNodeOps(test.renderer)
      const box = nodeOps.createElement('tui-box', undefined, undefined, undefined)
      const handler = vi.fn()
      // event props are set-only accessors backed by this internal store
      const listeners = (box as unknown as { _mouseListeners: Record<string, unknown> })
        ._mouseListeners

      nodeOps.patchProp(box, 'onMouseDown', null, handler)
      expect(listeners.down).toBe(handler)

      nodeOps.patchProp(box, 'onMouseDown', handler, undefined)
      expect(listeners.down).toBeUndefined()
    })

    it('restores defaults when a bound prop becomes undefined', async () => {
      const { render } = createRenderer(createNodeOps(test.renderer))
      const border = ref<boolean | undefined>(true)
      let el: BoxRenderable | undefined

      const App = defineComponent({
        setup() {
          return () =>
            h('tui-box', {
              border: border.value,
              ref: (r: unknown) => (el = r as BoxRenderable),
            })
        },
      })

      render(h(App), test.renderer.root)
      await test.renderOnce()
      expect(el!.border).toBe(true)

      border.value = undefined
      await nextTick()
      await test.renderOnce()
      expect(el!.border).toBe(false)
    })
  })
})
