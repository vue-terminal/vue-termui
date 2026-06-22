// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, Fragment, defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from './nodeOps'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { Renderable } from '@opentui/core'
import type { VNode } from '@vue/runtime-core'

/**
 * Vue creates Fragment boundary anchors as empty text nodes (`createText('')`)
 * and inserts them into the surrounding container — so `v-for`, multi-root
 * components and `<RouterView>` all put text nodes inside a `<box>`. Text nodes
 * are only valid inside a `<text>` in OpenTUI, so the renderer must place an
 * invisible layout anchor in their stead instead of crashing in `Box.add`.
 */
describe('nodeOps fragments', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 30, height: 8 })
    render = createRenderer(createNodeOps(test.renderer)).render as never
  })
  afterEach(() => test.renderer.destroy())

  it('mounts a fragment (v-for) inside a box', async () => {
    const App = defineComponent({
      setup() {
        const items = ['a', 'b', 'c']
        return () =>
          h('box', { flexDirection: 'column' }, [
            h(
              Fragment,
              null,
              items.map((label) => h('text', { key: label }, label)),
            ),
          ])
      },
    })

    expect(() => render(h(App), test.renderer.root)).not.toThrow()
    await test.renderOnce()
    const frame = test.captureCharFrame()
    expect(frame).toContain('a')
    expect(frame).toContain('b')
    expect(frame).toContain('c')
  })

  it('reorders v-for items reactively', async () => {
    const items = ref(['one', 'two', 'three'])
    const App = defineComponent({
      setup() {
        return () =>
          h(
            'box',
            { flexDirection: 'column' },
            h(
              Fragment,
              null,
              items.value.map((label) => h('text', { key: label }, label)),
            ),
          )
      },
    })

    render(h(App), test.renderer.root)
    await test.renderOnce()
    expect(test.captureCharFrame()).toContain('one')

    items.value = ['three', 'one']
    await nextTick()
    await test.renderOnce()
    const frame = test.captureCharFrame()
    expect(frame).toContain('three')
    expect(frame).toContain('one')
    expect(frame).not.toContain('two')
  })
})
