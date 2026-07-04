// @vitest-environment node
import { parseColor, TextAttributes, TextRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Text } from './Text'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('Text', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 10 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

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

  it('forwards native text options that are not declared props as attrs', async () => {
    // `fg` and `wrapMode` aren't declared on `Text` — they must fall through
    // as attrs onto the underlying renderable (the regression this guards).
    render(
      h(Text, { fg: '#42b883', wrapMode: 'word' }, () => 'styled'),
      test.renderer.root,
    )
    await test.renderOnce()

    const text = test.renderer.root.getChildren()[0] as TextRenderable
    expect(text.fg.equals(parseColor('#42b883'))).toBe(true)
    expect(text.wrapMode).toBe('word')
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
