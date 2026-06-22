// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Box } from '../components/Box'
import { useFocus, useFocusManager } from './focus'
import { BoxRenderable } from '@opentui/core'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

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

  it('useFocusManager exposes the current focus and can move it', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let manager: ReturnType<typeof useFocusManager> | undefined
    let element: ReturnType<typeof useFocus>['element'] | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          const focus = useFocus()
          element = focus.element
          return () => h('box', { ref: focus.ref })
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    expect(manager!.focused.value).toBe(null)
    const box = element!.value!
    manager!.focus(box)
    await nextTick()
    expect(manager!.focused.value).toBe(box)

    test.renderer.destroy()
  })
})
