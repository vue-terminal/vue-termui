// @vitest-environment node
import { createRenderer } from '@vue/runtime-core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from './nodeOps'
import { mockConsoleWarn } from '../__tests__/mock-console'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('nodeOps', () => {
  mockConsoleWarn()

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
        return () => h('box', null, [h('text', null, 'Hello vue-termui')])
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
        return () => h('box', null, [h('text', null, label.value)])
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

  it('warns when setText targets a non-text node', () => {
    const nodeOps = createNodeOps(test.renderer)
    const box = nodeOps.createElement('box', undefined, undefined, undefined)

    nodeOps.setText(box, 'nope')

    expect('[vue-termui] setText called on non-text node').toHaveBeenWarned()
  })

  it('warns when setElementText targets a non-text node', () => {
    const nodeOps = createNodeOps(test.renderer)
    const box = nodeOps.createElement('box', undefined, undefined, undefined)

    nodeOps.setElementText(box, 'nope')

    expect('[vue-termui] setElementText called on non-text node').toHaveBeenWarned()
  })
})
