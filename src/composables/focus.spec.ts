// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Box } from '../components/Box'
import { Input } from '../components/Input'
import { useFocus, useFocusManager } from './focus'
import { BoxRenderable, InputRenderable } from '@opentui/core'
import { ref } from '@vue/runtime-core'
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
  it('binds its ref through the Box component (function ref forwards)', async () => {
    // Guards the SidebarLink pattern: `useFocus().ref` must work when bound to
    // the <Box> component, not just a host <box>. The ref is a function so it
    // survives `<script setup>` unwrapping and forwards through the component.
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          const { ref: boxRef } = useFocus({ autoFocus: true })
          return () => h(Box, { ref: boxRef }, () => h('text', null, 'link'))
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    const box = test.renderer.root.getChildren()[0] as Renderable
    expect(box).toBeInstanceOf(BoxRenderable)
    expect(box.focusable).toBe(true)
    expect(test.renderer.currentFocusedRenderable).toBe(box)

    test.renderer.destroy()
  })

  it('useFocus marks the element focusable and autoFocuses it', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let focusedFlag = false
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          const { ref: boxRef, focused } = useFocus({ autoFocus: true })
          return () => {
            focusedFlag = focused.value
            return h('box', { ref: boxRef })
          }
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    const box = test.renderer.root.getChildren()[0] as Renderable
    expect(box.focusable).toBe(true)
    expect(test.renderer.currentFocusedRenderable).toBe(box)
    expect(focusedFlag).toBe(true)

    test.renderer.destroy()
  })

  it('useFocus focus()/blur() drive the focus state reactively', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let api: ReturnType<typeof useFocus> | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          api = useFocus()
          return () => h('box', { ref: api!.ref })
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    expect(api!.focused.value).toBe(false)
    api!.focus()
    await nextTick()
    expect(api!.focused.value).toBe(true)

    api!.blur()
    await nextTick()
    expect(api!.focused.value).toBe(false)

    test.renderer.destroy()
  })

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
})
