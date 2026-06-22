// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it, vi } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { onResize, useTerminalSize, useTitle } from './screen'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('screen composables', () => {
  it('onResize fires with the new dimensions and stops on unmount', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 10 })
    const sizes: Array<[number, number]> = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          onResize((w, h) => sizes.push([w, h]))
          return () => h('text', null, 'x')
        },
      }),
    )
    app.mount()
    await nextTick()

    test.resize(50, 20)
    await nextTick()
    expect(sizes.at(-1)).toEqual([50, 20])

    app.unmount()
    await nextTick()
    test.resize(60, 25)
    expect(sizes.at(-1)).toEqual([50, 20])

    test.renderer.destroy()
  })

  it('useTerminalSize tracks the size reactively', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 10 })
    const captured: { width?: number; height?: number } = {}
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          const { width, height } = useTerminalSize()
          captured.width = width.value
          return () => {
            captured.width = width.value
            captured.height = height.value
            return h('text', null, `${width.value}x${height.value}`)
          }
        },
      }),
    )
    app.mount()
    await nextTick()
    expect(captured).toEqual({ width: 30, height: 10 })

    test.resize(42, 12)
    await nextTick()
    expect(captured).toEqual({ width: 42, height: 12 })

    test.renderer.destroy()
  })

  it('useTitle sets the terminal title reactively and clears it on unmount', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const setTitle = vi.spyOn(test.renderer, 'setTerminalTitle')
    const title = ref('first')
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          useTitle(title)
          return () => h('text', null, 'x')
        },
      }),
    )
    app.mount()
    await nextTick()
    expect(setTitle).toHaveBeenCalledWith('first')

    title.value = 'second'
    await nextTick()
    expect(setTitle).toHaveBeenCalledWith('second')

    app.unmount()
    await nextTick()
    expect(setTitle).toHaveBeenLastCalledWith('')

    test.renderer.destroy()
  })
})
