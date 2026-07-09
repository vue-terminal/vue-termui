// @vitest-environment node
import { BoxRenderable, parseColor } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, defineComponent, h, nextTick } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { createTuiApp } from '../renderer/index'
import { Box } from './Box'
import { Text } from './Text'
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

  describe('border', () => {
    async function mountBox(props: Record<string, unknown>): Promise<BoxRenderable> {
      render(
        h(Box, props, () => []),
        test.renderer.root,
      )
      await test.renderOnce()
      return test.renderer.root.getChildren()[0] as BoxRenderable
    }

    it('leaves border unset when the prop is absent so the renderable keeps its default', async () => {
      const control = new BoxRenderable(test.renderer.root.ctx, {})
      expect((await mountBox({})).border).toBe(control.border)
      expect((await mountBox({ border: undefined })).border).toBe(control.border)
    })

    it('keeps the border inferred from borderStyle when no explicit border is passed', async () => {
      // OpenTUI infers a border when a style is set; a stray `border: false`
      // from an absent prop would defeat that.
      const box = await mountBox({ borderStyle: 'rounded' })
      expect(box.border).toBe(true)
    })

    it('reads a bare `border` attribute as true', async () => {
      const box = await mountBox({ border: '' })
      expect(box.border).toBe(true)
    })

    it('forwards an explicit false and an array of sides', async () => {
      expect((await mountBox({ border: false })).border).toBe(false)
      expect((await mountBox({ border: ['top', 'bottom'] })).border).toEqual(['top', 'bottom'])
    })
  })

  // The `focusedBorderColor` behavior needs OpenTUI's focus routing plus the
  // app-level `useCurrentFocusedElement()` provider, so these mount a real app
  // via `createTuiApp` onto the shared renderer (the bare `render` above has no
  // focus tracking — see `useCurrentFocusedElement`). A focusable child `Box`
  // stands in for any focusable descendant; focusing it should flip the
  // parent's border color.
  describe('focusedBorderColor', () => {
    async function mountWithChild(
      props: Record<string, unknown>,
    ): Promise<{ parent: BoxRenderable; child: Renderable }> {
      const app = createTuiApp(
        test.renderer,
        defineComponent({
          setup: () => () => h(Box, { border: true, ...props }, () => h(Box, { focusable: true })),
        }),
      )
      app.mount()
      await nextTick()

      const parent = test.renderer.root.getChildren()[0] as BoxRenderable
      const child = parent.getChildren()[0] as Renderable
      return { parent, child }
    }

    it('swaps borderColor to focusedBorderColor while a descendant is focused', async () => {
      const { parent, child } = await mountWithChild({
        borderColor: '#00ff00',
        focusedBorderColor: '#0000ff',
      })

      // Nothing focused yet: the resting borderColor is shown.
      expect(parent.borderColor.equals(parseColor('#00ff00'))).toBe(true)

      child.focus()
      await nextTick()
      expect(parent.borderColor.equals(parseColor('#0000ff'))).toBe(true)

      child.blur()
      await nextTick()
      expect(parent.borderColor.equals(parseColor('#00ff00'))).toBe(true)
    })

    it('keeps borderColor when a descendant focuses but no focusedBorderColor is set', async () => {
      const { parent, child } = await mountWithChild({ borderColor: '#00ff00' })

      child.focus()
      await nextTick()
      // With no focusedBorderColor, focus falls back to the plain borderColor.
      expect(parent.borderColor.equals(parseColor('#00ff00'))).toBe(true)
    })

    it("leaves the renderable's default borderColor untouched when neither color is set", async () => {
      const { parent, child } = await mountWithChild({})

      // Capture the renderable's own default, then prove focusing a descendant
      // does not clobber it with `undefined` (the bug `optionalProp` guards).
      const defaultColor = parent.borderColor
      child.focus()
      await nextTick()
      expect(parent.borderColor.equals(defaultColor)).toBe(true)
    })
  })
})
