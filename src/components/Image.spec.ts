// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { Jimp } from 'jimp'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Image, ImageRenderable, decodeImage } from './Image'
import type { ImageData } from './Image'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { OptimizedBuffer } from '@opentui/core'

function makeImageData(w = 4, h = 2): ImageData {
  return { data: new Uint8Array(w * h * 4), width: w, height: h }
}

async function pngBuffer(width: number, height: number, color: number): Promise<Buffer> {
  return new Jimp({ width, height, color }).getBuffer('image/png')
}

// Fills a w x h RGBA buffer where each pixel encodes its coordinates:
// r = x, g = y, b = x + y, fully opaque.
function gradientImageData(w: number, h: number): ImageData {
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const off = (y * w + x) * 4
      data[off] = x
      data[off + 1] = y
      data[off + 2] = x + y
      data[off + 3] = 255
    }
  }
  return { data, width: w, height: h }
}

// Collects setCell calls so renderSelf output can be asserted without a real
// screen buffer.
function fakeBuffer(): OptimizedBuffer & {
  cells: [number, number, string, unknown, unknown, number][]
} {
  const cells: [number, number, string, unknown, unknown, number][] = []
  return {
    cells,
    setCell(x: number, y: number, char: string, fg: unknown, bg: unknown, attrs: number) {
      cells.push([x, y, char, fg, bg, attrs])
    },
  } as unknown as OptimizedBuffer & { cells: typeof cells }
}

describe('Image', () => {
  it('decodes common image buffers into tightly-packed RGBA8 data', async () => {
    const png = await pngBuffer(1, 1, 0xff_00_00_ff)

    const image = await decodeImage(png, { background: false })

    expect(image.width).toBe(1)
    expect(image.height).toBe(1)
    expect(image.data).toBeInstanceOf(Uint8Array)
    expect(image.data).toHaveLength(4)
  })

  it('resizes to a target width while preserving the aspect ratio', async () => {
    const image = await decodeImage(await pngBuffer(8, 4, 0xff_00_00_ff), {
      width: 4,
      background: false,
    })

    expect(image.width).toBe(4)
    expect(image.height).toBe(2)
  })

  it('flattens transparency onto the default white background', async () => {
    // fully transparent red — the RGB channels must not leak through
    const image = await decodeImage(await pngBuffer(2, 1, 0xff_00_00_00))

    expect(image.data).toEqual(new Uint8Array([255, 255, 255, 255, 255, 255, 255, 255]))
  })

  it('flattens transparency onto a custom background color', async () => {
    const image = await decodeImage(await pngBuffer(1, 1, 0x00_00_00_00), { background: '#ff0000' })

    expect(image.data).toEqual(new Uint8Array([255, 0, 0, 255]))
  })

  it('keeps alpha untouched with background: false', async () => {
    const image = await decodeImage(await pngBuffer(1, 1, 0xff_00_00_80), { background: false })

    expect(image.data[3]).toBe(0x80)
  })

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

  it('keeps explicit display dimensions when the data updates', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
    const dataRef = ref<ImageData>(makeImageData(4, 2))

    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Image, { data: dataRef.value, displayWidth: 20, displayHeight: 7 }),
      }),
    )
    app.mount()
    await nextTick()
    await test.renderOnce()

    const child = test.renderer.root.getChildren()[0] as ImageRenderable

    dataRef.value = makeImageData(8, 8)
    await nextTick()
    await test.renderOnce()

    expect(child.displayWidth).toBe(20)
    expect(child.displayHeight).toBe(7)
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

  describe('renderSelf', () => {
    it('area-averages source pixels when downsampling', async () => {
      const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
      // 2x2 gradient (r=x, g=y, b=x+y) squeezed into a single cell: the top
      // pixel averages (0,0,0)+(1,0,1), the bottom (0,1,1)+(1,1,2).
      const renderable = new ImageRenderable(test.renderer, {
        imageData: gradientImageData(2, 2),
        displayWidth: 1,
        displayHeight: 1,
      })

      const buffer = fakeBuffer()
      renderable.render(buffer, 0)

      expect(buffer.cells).toHaveLength(1)
      const [, , char, fg, bg] = buffer.cells[0]!
      expect(char).toBe('\u2584')
      // fg = bottom pixel average, bg = top pixel average (rounded)
      expect((fg as { toInts(): number[] }).toInts().slice(0, 3)).toEqual([1, 1, 2])
      expect((bg as { toInts(): number[] }).toInts().slice(0, 3)).toEqual([1, 0, 1])
      test.renderer.destroy()
    })

    it('composites transparent pixels over the background', async () => {
      const test: TestRendererSetup = await createTestRenderer({ width: 40, height: 10 })
      const img = makeImageData(1, 2) // all zeros: fully transparent black

      const renderable = new ImageRenderable(test.renderer, {
        imageData: img,
        background: '#ff0000',
      })

      const buffer = fakeBuffer()
      renderable.render(buffer, 0)

      const [, , , fg, bg] = buffer.cells[0]!
      expect((fg as { toInts(): number[] }).toInts().slice(0, 3)).toEqual([255, 0, 0])
      expect((bg as { toInts(): number[] }).toInts().slice(0, 3)).toEqual([255, 0, 0])
      test.renderer.destroy()
    })
  })
})
