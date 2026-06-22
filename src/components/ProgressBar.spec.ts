// @vitest-environment node
import { TextRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { ProgressBar } from './ProgressBar'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

// `plainText` only reflects the set content after a render pass, so callers
// must `await test.renderOnce()` before reading segment lengths.
function barSegments(root: Renderable): [number, number] {
  const box = root.getChildren()[0]!
  const [filled, track] = box.getChildren() as TextRenderable[]
  return [filled!.plainText.length, track!.plainText.length]
}

describe('ProgressBar', () => {
  it('fills the bar proportionally to value/max', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(ProgressBar, { value: 0.5, width: 10 }) }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    expect(barSegments(test.renderer.root)).toEqual([5, 5])
    test.renderer.destroy()
  })

  it('supports an explicit max and updates reactively', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 4 })
    const value = ref(25)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(ProgressBar, { value: value.value, max: 100, width: 20 }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()
    expect(barSegments(test.renderer.root)).toEqual([5, 15])

    value.value = 100
    await nextTick()
    await test.renderOnce()
    expect(barSegments(test.renderer.root)).toEqual([20, 0])

    test.renderer.destroy()
  })

  it('clamps out-of-range values', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(ProgressBar, { value: 5, max: 1, width: 8 }) }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()
    expect(barSegments(test.renderer.root)).toEqual([8, 0])
    test.renderer.destroy()
  })
})
