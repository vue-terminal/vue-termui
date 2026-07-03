// @vitest-environment node
import { parseColor, TextAttributes, TextRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  it('resolves event-modifier bindings onto the renderable (functional path)', async () => {
    // Proves the functional-component attr path also runs through
    // `resolveEventListeners`; the encoded prop name is what the SFC transform
    // emits for `@keyDown.enter`.
    const onEnter = vi.fn()
    render(
      h(Text, { onKeyDown__enter: onEnter }, () => 'x'),
      test.renderer.root,
    )
    await test.renderOnce()

    const text = test.renderer.root.getChildren()[0] as TextRenderable
    const key = (name: string) => ({ name, ctrl: false, shift: false, option: false, meta: false })

    text.onKeyDown!(key('a') as never)
    expect(onEnter).toHaveBeenCalledTimes(0)

    text.onKeyDown!(key('return') as never)
    expect(onEnter).toHaveBeenCalledTimes(1)
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
