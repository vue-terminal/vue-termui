// @vitest-environment node
import { BoxRenderable, parseColor, TextAttributes, TextRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Box, Newline, Text } from './index'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('core components', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  describe('Box', () => {
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

  describe('Text', () => {
    it('maps boolean style props to the attributes bitmask', async () => {
      render(
        h(Text, { bold: true, underline: true }, () => 'styled'),
        test.renderer.root,
      )
      await test.renderOnce()

      const text = test.renderer.root.getChildren()[0] as TextRenderable
      expect(text).toBeInstanceOf(TextRenderable)
      expect(text.attributes & TextAttributes.BOLD).toBeTruthy()
      expect(text.attributes & TextAttributes.UNDERLINE).toBeTruthy()
      expect(text.attributes & TextAttributes.ITALIC).toBeFalsy()
    })

    it('renders reactive text content', async () => {
      const label = ref('one')
      render(
        h(Text, null, () => label.value),
        test.renderer.root,
      )
      await test.renderOnce()
      expect(test.captureCharFrame()).toContain('one')

      label.value = 'two'
      await nextTick()
      await test.renderOnce()
      const frame = test.captureCharFrame()
      expect(frame).toContain('two')
      expect(frame).not.toContain('one')
    })
  })

  describe('Newline', () => {
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
})
