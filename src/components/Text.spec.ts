// @vitest-environment node
import { bold, parseColor, t, TextAttributes, TextRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Text } from './Text'
import { mockConsoleError } from '../__tests__/mock-console'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('Text', () => {
  mockConsoleError()

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

  it('reports and drops a nested Text instead of crashing', async () => {
    // Nesting isn't supported (OpenTUI text holds inline content, not blocks).
    // The nested Text is dropped, the surrounding text still renders, and the
    // diagnostic points at the `content` prop. The guard is gated on
    // `process.env.NODE_ENV !== 'production'` (true under the test runner) and is
    // compiled out of an app's production build.
    render(
      h(Text, null, () => ['Press ', h(Text, { bold: true }, () => 'q'), ' to quit']),
      test.renderer.root,
    )
    await test.renderOnce()

    const frame = test.captureCharFrame()
    expect(frame).toContain('Press ')
    expect(frame).toContain(' to quit')
    expect('<Text> cannot be nested inside another <Text>').toHaveBeenErrored()
  })

  it('renders styled spans within a line via the `content` prop', async () => {
    // The supported way to style part of a line: a StyledText passed to
    // `content`, built with `t`/`bold`/`fg` from `@opentui/core` — no nesting.
    render(h(Text, { content: t`Press ${bold('q')} to quit` }), test.renderer.root)
    await test.renderOnce()

    const text = test.renderer.root.getChildren()[0] as TextRenderable
    expect(text).toBeInstanceOf(TextRenderable)
    expect(test.captureCharFrame()).toContain('Press q to quit')
  })

  it('keeps its wrapped height under flex height pressure', async () => {
    // In a height-constrained column, flex shrink used to squeeze a wrapped
    // Text below its measured height while it still painted every wrapped
    // row, corrupting the sibling underneath (chars showing through spaces).
    render(
      h('tui-box', { flexDirection: 'column' }, [
        h(
          Text,
          null,
          () => 'TresJS — declarative three.js components rendered by @vue-termui/three',
        ),
        h(Text, null, () => 'Space: toggle spin (on) · C: cycle color'),
        h('tui-box', { border: true, height: 10 }),
      ]),
      test.renderer.root,
    )
    await test.renderOnce()

    const frame = test.captureCharFrame()
    expect(frame).toContain('components rendered by @vue-termui/three')
    expect(frame).toContain('Space: toggle spin (on) · C: cycle color')
  })
})
