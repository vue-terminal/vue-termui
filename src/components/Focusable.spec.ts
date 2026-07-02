// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref, type VNode } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Box } from './Box'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

// The `focusable` prop is shared by every renderable (it maps to OpenTUI's
// side-effect-free `Renderable.focusable` accessor). These cases exercise the
// same contract across a spread of components: one that is *not* focusable by
// default (`Box`) and three that *are* (`Input`, `Textarea`, `Select`).
interface FocusableCase {
  name: string
  /** The renderable's built-in `focusable` value when the prop is left unset. */
  defaultFocusable: boolean
  /** Render the component, optionally forcing the `focusable` prop. */
  render: (focusable?: boolean) => VNode
}

const cases: FocusableCase[] = [
  {
    name: 'Box',
    defaultFocusable: false,
    render: (focusable) => (focusable === undefined ? h(Box) : h(Box, { focusable })),
  },
  {
    name: 'Input',
    defaultFocusable: true,
    render: (focusable) => h(Input, { modelValue: '', focusable }),
  },
  {
    name: 'Textarea',
    defaultFocusable: true,
    render: (focusable) => h(Textarea, { modelValue: '', focusable }),
  },
  {
    name: 'Select',
    defaultFocusable: true,
    render: (focusable) => h(Select, { options: [{ name: 'One' }], modelValue: 0, focusable }),
  },
]

async function mount(node: VNode): Promise<{ test: TestRendererSetup; el: Renderable }> {
  const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
  const app = createTuiApp(test.renderer, defineComponent({ setup: () => () => node }))
  app.mount()
  await nextTick()
  return { test, el: test.renderer.root.getChildren()[0] as Renderable }
}

describe.each(cases)('$name focusable prop', ({ render, defaultFocusable }) => {
  it('keeps the renderable default when the prop is unset', async () => {
    const { test, el } = await mount(render(undefined))
    expect(el.focusable).toBe(defaultFocusable)
    test.renderer.destroy()
  })

  it('makes the element focusable with `focusable`', async () => {
    const { test, el } = await mount(render(true))
    expect(el.focusable).toBe(true)

    el.focus()
    expect(el.focused).toBe(true)

    test.renderer.destroy()
  })

  it('makes the element non-focusable with `:focusable="false"`', async () => {
    const { test, el } = await mount(render(false))
    expect(el.focusable).toBe(false)

    // `focus()` is a no-op on a non-focusable renderable.
    el.focus()
    expect(el.focused).toBe(false)

    test.renderer.destroy()
  })
})

describe('focusable reactivity', () => {
  it('toggles the renderable `focusable` when the prop changes', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
    const focusable = ref(false)
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(Box, { focusable: focusable.value }) }),
    )
    app.mount()
    await nextTick()

    const box = test.renderer.root.getChildren()[0] as Renderable
    expect(box.focusable).toBe(false)

    focusable.value = true
    await nextTick()
    expect(box.focusable).toBe(true)

    focusable.value = false
    await nextTick()
    expect(box.focusable).toBe(false)

    test.renderer.destroy()
  })
})
