// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createNodeOps, createTuiApp } from '../renderer/index'
import { Input } from '../components/Input'
import { useCurrentFocusedElement, useFocusManager } from './focus'
import { InputRenderable } from '@opentui/core'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

function findFocusable(node: Renderable): Renderable | null {
  for (const child of node.getChildren()) {
    if (child.focusable) return child
    const found = findFocusable(child)
    if (found) return found
  }
  return null
}

describe('focus composables', () => {
  it('useFocusManager cycles focus forward/backward, wrapping and skipping non-focusables', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 6 })
    let manager: ReturnType<typeof useFocusManager> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          // A non-focusable box sits between the two focusable ones; cycling
          // must skip it and keep tree order (first → third → wrap).
          return () =>
            h('box', null, [
              h('box', { focusable: true }),
              h('box', { focusable: false }),
              h('box', { focusable: true }),
            ])
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    const [first, , third] = test.renderer.root.getChildren()[0]!.getChildren()

    // Nothing focused yet: forward starts at the first focusable.
    expect(manager!.focused.value).toBe(null)
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(first)

    // The middle box is not focusable, so next lands on the third.
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(third)

    // Forward from the last wraps to the first; backward wraps to the last.
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(first)
    manager!.focusPrevious()
    await nextTick()
    expect(manager!.focused.value).toBe(third)

    // blur() clears whatever holds focus.
    manager!.blur()
    await nextTick()
    expect(manager!.focused.value).toBe(null)

    // From nothing focused, backward starts at the last focusable.
    manager!.focusPrevious()
    await nextTick()
    expect(manager!.focused.value).toBe(third)

    test.renderer.destroy()
  })

  it('useFocusManager.focusNext() truly focuses so the element receives key input', async () => {
    // Regression: cycling must actually focus the element (register its key
    // handler, mark it focused), not merely move the renderer's
    // `currentFocusedRenderable` pointer. The pointer alone makes `focused`
    // read correctly while the element receives no keystrokes — which is how
    // `renderer.focusRenderable()` silently broke Tab navigation.
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 4 })
    const model = ref('')
    let manager: ReturnType<typeof useFocusManager> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          return () =>
            h(Input, {
              modelValue: model.value,
              'onUpdate:modelValue': (v: string) => (model.value = v),
            })
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    manager!.focusNext()
    await nextTick()

    const input = findFocusable(test.renderer.root)
    expect(input).toBeInstanceOf(InputRenderable)
    expect(manager!.focused.value).toBe(input)

    // The real contract: a focused element receives keystrokes. This is what
    // `renderer.focusRenderable()` failed to deliver, and it is strictly
    // stronger than checking `input.focused` — it also proves the element's key
    // handler was registered, not just that its `_focused` flag flipped.
    await test.mockInput.typeText('hi')
    await nextTick()
    expect(model.value).toBe('hi')

    test.renderer.destroy()
  })

  it('focusNext()/focusPrevious() are no-ops when nothing is focusable', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let manager: ReturnType<typeof useFocusManager> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          // Not a single focusable element in the tree.
          return () => h('box', null, [h('box'), h('text', null, 'x')])
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    expect(manager!.focused.value).toBe(null)
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(null)
    manager!.focusPrevious()
    await nextTick()
    expect(manager!.focused.value).toBe(null)

    test.renderer.destroy()
  })

  it('skips invisible focusables when cycling', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 6 })
    let manager: ReturnType<typeof useFocusManager> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          // The middle box is focusable but hidden; cycling must skip it just
          // like a non-focusable one.
          return () =>
            h('box', null, [
              h('box', { focusable: true }),
              h('box', { focusable: true, visible: false }),
              h('box', { focusable: true }),
            ])
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    const [first, , third] = test.renderer.root.getChildren()[0]!.getChildren()

    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(first)

    // Invisible middle is skipped, so next lands on the third.
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(third)

    test.renderer.destroy()
  })

  it('collects focusables depth-first, so a focusable parent precedes its child', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 8 })
    let manager: ReturnType<typeof useFocusManager> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          // A focusable element that itself contains a focusable child, then a
          // focusable sibling. Depth-first tab order is outer → inner → sibling.
          return () =>
            h('box', null, [
              h('box', { focusable: true }, [h('box', { focusable: true })]),
              h('box', { focusable: true }),
            ])
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    const wrapper = test.renderer.root.getChildren()[0]!
    const outer = wrapper.getChildren()[0]!
    const inner = outer.getChildren()[0]!
    const sibling = wrapper.getChildren()[1]!

    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(outer)

    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(inner)

    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(sibling)

    // Wrapping forward from the last returns to the depth-first first (outer).
    manager!.focusNext()
    await nextTick()
    expect(manager!.focused.value).toBe(outer)

    test.renderer.destroy()
  })

  it('useCurrentFocusedElement is shared app-wide and tracks focus reactively', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let a: ReturnType<typeof useCurrentFocusedElement> | undefined
    let b: ReturnType<typeof useCurrentFocusedElement> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          a = useCurrentFocusedElement()
          b = useCurrentFocusedElement()
          return () => h('box', { focusable: true })
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    // Every call in the same app injects the one provided ref (deduped).
    expect(a).toBe(b)
    expect(a!.value).toBe(null)

    const box = test.renderer.root.getChildren()[0]!
    box.focus()
    await nextTick()
    expect(a!.value).toBe(box)

    box.blur()
    await nextTick()
    expect(a!.value).toBe(null)

    test.renderer.destroy()
  })

  it('useCurrentFocusedElement returns an inert standalone ref without an app provider', async () => {
    // Rendered through a bare renderer (no `createTuiApp`), so nothing provides
    // the injection: the composable must fall back to a standalone ref rather
    // than throw, and that ref stays inert — no renderer wiring updates it.
    const test: TestRendererSetup = await createTestRenderer({ width: 10, height: 3 })
    let focused: ReturnType<typeof useCurrentFocusedElement> | undefined
    const { render } = createRenderer(createNodeOps(test.renderer))
    render(
      h(
        defineComponent({
          setup() {
            focused = useCurrentFocusedElement()
            return () => h('box', { focusable: true })
          },
        }),
      ),
      test.renderer.root,
    )
    await nextTick()

    expect(focused!.value).toBe(null)

    // Focusing the element does not update the standalone ref (inert fallback).
    test.renderer.root.getChildren()[0]!.focus()
    await nextTick()
    expect(focused!.value).toBe(null)

    test.renderer.destroy()
  })
})
