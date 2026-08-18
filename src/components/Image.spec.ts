// @vitest-environment node
import { ImageRenderable, NativeImage } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { Image } from './Image'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

// Encoded PNG bytes (4×2 and 8×4, one flat color each) rather than fixture
// files: `source` accepts raw bytes and OpenTUI sniffs the format from them, so
// the differing dimensions are enough to tell the two images apart.
const PNG_4x2 = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAIAAADwyuo0AAAAEklEQVQI12N02tHMAANMDEgAACPFAYGUUqj6AAAAAElFTkSuQmCC',
    'base64',
  ),
)
const PNG_8x4 = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAIAAAA8r+mnAAAAFElEQVQI12M09YxjwAaYGHAA0iUAVgMA5ICSO4IAAAAASUVORK5CYII=',
    'base64',
  ),
)

describe('Image', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void
  const mounted = (): ImageRenderable => test.renderer.root.getChildren()[0] as ImageRenderable

  beforeEach(async () => {
    test = await createTestRenderer({ width: 20, height: 8 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('renders an ImageRenderable and decodes the source', async () => {
    render(h(Image, { source: PNG_4x2, width: 8, height: 4 }), test.renderer.root)

    const image = mounted()
    expect(image).toBeInstanceOf(ImageRenderable)
    await image.loadPromise
    expect(image.loading).toBe(false)
    expect(image.loadError).toBe(null)
    expect(image.image?.width).toBe(4)
    expect(image.image?.height).toBe(2)
  })

  it("keeps the renderable's defaults when fit and protocol are unset", () => {
    render(h(Image, { source: PNG_4x2 }), test.renderer.root)
    expect(mounted().fit).toBe('fit')
    expect(mounted().protocol).toBe('auto')
  })

  it('forwards fit and protocol', () => {
    render(h(Image, { source: PNG_4x2, fit: 'cover', protocol: 'blocks' }), test.renderer.root)
    expect(mounted().fit).toBe('cover')
    expect(mounted().protocol).toBe('blocks')
  })

  it('paints the image into the frame', async () => {
    const source = ref<Uint8Array | undefined>(undefined)
    render(
      h(() => h(Image, { source: source.value, width: 8, height: 4, protocol: 'blocks' })),
      test.renderer.root,
    )
    await test.renderOnce()
    expect(test.captureCharFrame().trim()).toBe('')

    source.value = PNG_4x2
    await nextTick()
    await mounted().loadPromise
    await test.renderOnce()
    expect(test.captureCharFrame().trim()).not.toBe('')
  })

  it('calls the load handler with the decoded image', async () => {
    const onLoad = vi.fn()
    render(h(Image, { source: PNG_4x2, onLoad }), test.renderer.root)

    await mounted().loadPromise
    expect(onLoad).toHaveBeenCalledTimes(1)
    expect(onLoad).toHaveBeenCalledWith(expect.any(NativeImage))
  })

  it('reports a failed load through the error handler', async () => {
    const onError = vi.fn()
    render(h(Image, { source: './does-not-exist.png', onError }), test.renderer.root)

    await mounted().loadPromise
    expect(onError).toHaveBeenCalledTimes(1)
    expect(mounted().loadError).toBeInstanceOf(Error)
    expect(mounted().image).toBe(null)
  })

  it('swaps the image when the source changes', async () => {
    const source = ref<Uint8Array | undefined>(PNG_4x2)
    render(
      h(() => h(Image, { source: source.value })),
      test.renderer.root,
    )
    await mounted().loadPromise
    expect(mounted().image?.width).toBe(4)

    source.value = PNG_8x4
    await nextTick()
    await mounted().loadPromise
    expect(mounted().image?.width).toBe(8)
  })

  it('clears the image when the source is unset', async () => {
    const source = ref<Uint8Array | undefined>(PNG_4x2)
    render(
      h(() => h(Image, { source: source.value })),
      test.renderer.root,
    )
    await mounted().loadPromise
    expect(mounted().image).not.toBe(null)

    source.value = undefined
    await nextTick()
    expect(mounted().image).toBe(null)
  })

  it('accepts an already decoded image', async () => {
    const decoded = NativeImage.decode(PNG_8x4)
    render(h(Image, { source: decoded }), test.renderer.root)

    await mounted().loadPromise
    expect(mounted().image?.width).toBe(8)
    // The renderable retains its own handle, so releasing ours is safe.
    decoded.dispose()
    expect(mounted().image?.width).toBe(8)
  })
})
