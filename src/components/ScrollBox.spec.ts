// @vitest-environment node
import { ScrollBoxRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { createTuiApp } from '../renderer/index'
import { Box } from './Box'
import { ScrollBox } from './ScrollBox'
import { Text } from './Text'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

const lines = (count: number): VNode[] =>
  Array.from({ length: count }, (_, i) => h(Text, { key: i }, () => `line ${i}`))

describe('ScrollBox', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 30, height: 8 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders a ScrollBoxRenderable with its children scrollable', async () => {
    render(
      h(ScrollBox, { height: 4 }, () => lines(10)),
      test.renderer.root,
    )
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    expect(scrollBox).toBeInstanceOf(ScrollBoxRenderable)
    // 10 one-cell-tall lines in a 4-cell-tall viewport
    expect(scrollBox.scrollHeight).toBe(10)
    const frame = test.captureCharFrame()
    expect(frame).toContain('line 0')
    expect(frame).not.toContain('line 9')
  })

  it('scrollTo reveals content further down', async () => {
    render(
      h(ScrollBox, { height: 4 }, () => lines(10)),
      test.renderer.root,
    )
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    scrollBox.scrollTo(6)
    await test.renderOnce()

    expect(scrollBox.scrollTop).toBe(6)
    const frame = test.captureCharFrame()
    expect(frame).toContain('line 9')
    expect(frame).not.toContain('line 0')
  })

  it('scrolls with the keyboard when focused', async () => {
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(ScrollBox, { height: 4, autofocus: true }, () => lines(10)),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    expect(scrollBox.focused).toBe(true)
    expect(scrollBox.scrollTop).toBe(0)

    test.mockInput.pressArrow('down')
    await test.renderOnce()
    expect(scrollBox.scrollTop).toBeGreaterThan(0)
  })

  it('mounts v-for (fragment) children and follows list growth', async () => {
    const count = ref(2)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(ScrollBox, { height: 4 }, () => lines(count.value)),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    expect(scrollBox.scrollHeight).toBeLessThanOrEqual(4)

    count.value = 12
    await nextTick()
    await test.renderOnce()
    expect(scrollBox.scrollHeight).toBe(12)
  })

  it('sticky bottom keeps the view pinned as content grows', async () => {
    const count = ref(10)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () =>
          h(ScrollBox, { height: 4, stickyScroll: true, stickyStart: 'bottom' }, () =>
            lines(count.value),
          ),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    const maxScrollTop = scrollBox.scrollHeight - scrollBox.viewport.height
    expect(maxScrollTop).toBeGreaterThan(0)
    expect(scrollBox.scrollTop).toBe(maxScrollTop)

    count.value = 20
    await nextTick()
    await test.renderOnce()
    expect(scrollBox.scrollTop).toBe(scrollBox.scrollHeight - scrollBox.viewport.height)
    expect(scrollBox.scrollTop).toBeGreaterThan(maxScrollTop)
  })

  it('scrollX enables horizontal scrolling (constructor-only option)', async () => {
    render(
      h(ScrollBox, { height: 4, width: 10, scrollX: true }, () => h(Box, { width: 40, height: 1 })),
      test.renderer.root,
    )
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    expect(scrollBox.scrollWidth).toBe(40)
    scrollBox.scrollBy({ x: 5, y: 0 })
    expect(scrollBox.scrollLeft).toBe(5)
  })

  it('clamps horizontal content without scrollX (default)', async () => {
    render(
      h(ScrollBox, { height: 4, width: 10 }, () => h(Box, { width: 40, height: 1 })),
      test.renderer.root,
    )
    await test.renderOnce()

    const scrollBox = test.renderer.root.getChildren()[0] as ScrollBoxRenderable
    scrollBox.scrollBy({ x: 5, y: 0 })
    expect(scrollBox.scrollLeft).toBe(0)
  })
})
