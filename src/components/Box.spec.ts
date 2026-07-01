// @vitest-environment node
import { BoxRenderable, parseColor } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Box, Text } from './index'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('Box', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders a BoxRenderable with its default slot', async () => {
    render(
      h(Box, null, () => h(Text, null, () => 'inside')),
      test.renderer.root,
    )
    await test.renderOnce()

    const box = test.renderer.root.getChildren()[0]!
    expect(box).toBeInstanceOf(BoxRenderable)
    expect(test.captureCharFrame()).toContain('inside')
  })

  it('forwards layout/style props to the underlying renderable', async () => {
    render(
      h(Box, { backgroundColor: '#ff0000' }, () => []),
      test.renderer.root,
    )
    await test.renderOnce()

    const box = test.renderer.root.getChildren()[0] as BoxRenderable
    // `backgroundColor` exposes a getter (unlike layout props, which are
    // write-only), so it is the clearest proof the prop reached the renderable.
    expect(box.backgroundColor.equals(parseColor('#ff0000'))).toBe(true)
  })
})
