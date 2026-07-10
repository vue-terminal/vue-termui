// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { PerspectiveCamera } from 'three'
import { describe, expect, it } from 'vitest'
import { ThreeRenderable } from './ThreeRenderable'

describe('ThreeRenderable', () => {
  it('re-syncs the camera aspect when the pixel resolution arrives late', async () => {
    const test = await createTestRenderer({ width: 40, height: 10 })
    const camera = new PerspectiveCamera(45, 1, 0.1, 100)
    const renderable = new ThreeRenderable(test.renderer, { width: 20, height: 5, camera })
    test.renderer.root.add(renderable)
    await test.renderOnce()

    // no pixel resolution reported yet: the fallback assumes 1:2 cells
    expect(camera.aspect).toBeCloseTo(20 / (5 * 2), 5)

    // the terminal answers OpenTUI's pixel-size query only after setup; cells
    // are really 10x24 px, so the drawn area is wider than the fallback guess
    Object.defineProperty(test.renderer, 'resolution', {
      configurable: true,
      get: () => ({ width: 40 * 10, height: 10 * 24 }),
    })
    await test.renderOnce()
    expect(camera.aspect).toBeCloseTo((20 * 10) / (5 * 24), 5)

    renderable.destroy()
    test.renderer.destroy()
  })
})
