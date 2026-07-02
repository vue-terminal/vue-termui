// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Newline } from './Newline'
import type { Renderable, TextRenderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('Newline', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders a single newline by default', async () => {
    render(h(Newline), test.renderer.root)
    await test.renderOnce()
    const text = test.renderer.root.getChildren()[0] as TextRenderable
    expect(text.plainText).toBe('\n')
  })

  it('repeats the newline `count` times', async () => {
    render(h(Newline, { count: 3 }), test.renderer.root)
    await test.renderOnce()
    const text = test.renderer.root.getChildren()[0] as TextRenderable
    expect(text.plainText).toBe('\n\n\n')
  })
})
