// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Image } from './Image'
import { ImageRenderable } from './Image'
import type { TestRendererSetup } from '@opentui/core/testing'

function makeImageData(w = 4, h = 2): { data: Uint8Array; width: number; height: number } {
  return { data: new Uint8Array(w * h * 4), width: w, height: h }
}

describe('Image', () => {
  it('creates an ImageRenderable when data is provided', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const img = makeImageData()

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: img }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0]
    expect(child).toBeInstanceOf(ImageRenderable)
    test.renderer.destroy()
  })

  it('renders without error when data is null', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: null }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0]
    expect(child).toBeInstanceOf(ImageRenderable)
    test.renderer.destroy()
  })

  it('forwards displayWidth to the renderable layout', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const img = makeImageData(8, 4)

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: img, displayWidth: 20 }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0] as ImageRenderable
    expect(child.displayWidth).toBe(20)
    test.renderer.destroy()
  })

  it('uses half the source pixel height as the natural terminal height', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const img = makeImageData(8, 5)

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: img }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0] as ImageRenderable
    expect(child.displayHeight).toBe(3)
    test.renderer.destroy()
  })

  it('updates reactively when data changes', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const dataRef = ref(makeImageData(4, 2))

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: dataRef.value }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0] as ImageRenderable
    const initial = child.imageData

    // Change to new data
    dataRef.value = makeImageData(8, 8)
    await nextTick()
    await test.renderOnce()

    expect(child.imageData).not.toBe(initial)
    expect(child.imageData!.width).toBe(8)
    expect(child.imageData!.height).toBe(8)
    test.renderer.destroy()
  })

  it('clears image data when set to null', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const dataRef = ref<ReturnType<typeof makeImageData> | null>(makeImageData())

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: dataRef.value }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    dataRef.value = null
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0] as ImageRenderable
    expect(child.imageData).toBeNull()
    test.renderer.destroy()
  })
})
