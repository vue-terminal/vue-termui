// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { useFocus, useFocusManager } from './focus'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('focus composables', () => {
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
    let firstRef: ReturnType<typeof useFocus>['ref'] | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          manager = useFocusManager()
          const { ref } = useFocus()
          firstRef = ref
          return () => h('box', { ref })
        },
      }),
    )
    app.mount()
    await nextTick()
    await nextTick()

    expect(manager!.focused.value).toBe(null)
    const box = firstRef!.value!
    manager!.focus(box)
    await nextTick()
    expect(manager!.focused.value).toBe(box)

    test.renderer.destroy()
  })
})
