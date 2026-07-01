// @vitest-environment node
import { MarkdownRenderable, SyntaxStyle } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Markdown } from './index'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

// These tests assert the wiring between the component's props and the underlying
// `MarkdownRenderable`. The actual painting of markdown goes through OpenTUI's
// async tree-sitter highlighter (tested upstream), so we check the renderable's
// state rather than captured frames.
describe('Markdown', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void
  // `SyntaxStyle.fromStyles` needs the native render library, so build the style
  // per-test once a renderer is up.
  let syntaxStyle: SyntaxStyle
  const mounted = (): MarkdownRenderable =>
    test.renderer.root.getChildren()[0] as MarkdownRenderable

  beforeEach(async () => {
    test = await createTestRenderer({ width: 40, height: 12 })
    render = createRenderer(createNodeOps(test.renderer)).render
    syntaxStyle = SyntaxStyle.fromStyles({ default: { fg: '#e6edf3' } })
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders a MarkdownRenderable with the given content', () => {
    render(h(Markdown, { content: '# Title', syntaxStyle }), test.renderer.root)

    const md = mounted()
    expect(md).toBeInstanceOf(MarkdownRenderable)
    expect(md.content).toBe('# Title')
  })

  it('requires a syntax style at creation', () => {
    const nodeOps = createNodeOps(test.renderer)
    // The renderable requires a `syntaxStyle`, so the host element cannot be
    // created without one — fail loudly instead of silently seeding a default.
    expect(() => nodeOps.createElement('markdown', undefined, undefined, null)).toThrow(
      /syntaxStyle/i,
    )
    expect(() =>
      nodeOps.createElement('markdown', undefined, undefined, { syntaxStyle }),
    ).not.toThrow()
  })

  it('forwards a custom syntax style', () => {
    const custom = SyntaxStyle.fromStyles({ default: { fg: '#42b883' } })
    render(h(Markdown, { content: '# Title', syntaxStyle: custom }), test.renderer.root)
    expect(mounted().syntaxStyle).toBe(custom)
  })

  it('keeps undefined conceal by default', () => {
    render(h(Markdown, { content: '# Title', syntaxStyle }), test.renderer.root)
    expect(mounted().conceal).toBe(undefined)
  })

  it('forwards boolean options when set', () => {
    render(
      h(Markdown, {
        content: 'x',
        syntaxStyle,
        conceal: false,
        concealCode: true,
        streaming: true,
      }),
      test.renderer.root,
    )
    const md = mounted()
    expect(md.conceal).toBe(false)
    expect(md.concealCode).toBe(true)
    expect(md.streaming).toBe(true)
  })

  it('forwards native options (fg) as attrs', () => {
    render(h(Markdown, { content: 'x', syntaxStyle, fg: '#42b883' }), test.renderer.root)
    // `fg` is parsed into an RGBA on the renderable.
    expect(mounted().fg).toBeDefined()
  })

  it('updates the renderable when content changes reactively', async () => {
    const content = ref('# one')
    render(
      h(() => h(Markdown, { content: content.value, syntaxStyle })),
      test.renderer.root,
    )
    expect(mounted().content).toBe('# one')

    content.value = '# two'
    await nextTick()
    expect(mounted().content).toBe('# two')
  })
})
