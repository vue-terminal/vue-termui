// @vitest-environment node
import { RGBA } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { Scene } from 'three'
import { describe, expect, it } from 'vitest'
import { SuperSampleType, ThreeCliRenderer } from './WGPURenderer'

// OptimizedBuffer fg/bg hold 4 entries per cell with 0-255 channel values
const RED = RGBA.fromValues(1, 0, 0, 1)

// GPU-less CI runners are unreliable for real device creation: Dawn falls
// back past Vulkan (VK_ERROR_INCOMPATIBLE_DRIVER) and node:ffi's experimental
// internals can then abort the whole worker (abseil raw_hash_set assertion) —
// a native crash no try/catch can contain. Keep these as local integration
// tests; the FFI shim itself stays covered on CI by bun-ffi.spec.ts.
// Crash example: https://github.com/vue-terminal/vue-termui/actions/runs/29015437754
describe.skipIf(process.env.CI)('ThreeCliRenderer', () => {
  it(
    'draws the clear color into the buffer without supersampling',
    { timeout: 30_000 },
    async () => {
      const test = await createTestRenderer({ width: 16, height: 8 })
      const engine = new ThreeCliRenderer(test.renderer, {
        width: 16,
        height: 8,
        superSample: SuperSampleType.NONE,
        backgroundColor: RED,
      })
      await engine.init()

      const buffer = test.renderer.nextRenderBuffer
      await engine.drawScene(new Scene(), buffer, 0)

      const { char, fg } = buffer.buffers
      expect(String.fromCodePoint(char[0]!)).toBe('█')
      expect(fg[0]!).toBeGreaterThan(230)
      expect(fg[1]!).toBeLessThan(25)

      engine.destroy()
      test.renderer.destroy()
    },
  )

  it(
    'renders through the GPU supersampling compute path by default',
    { timeout: 30_000 },
    async () => {
      const test = await createTestRenderer({ width: 16, height: 8 })
      const engine = new ThreeCliRenderer(test.renderer, {
        width: 16,
        height: 8,
        backgroundColor: RED,
      })
      await engine.init()

      const buffer = test.renderer.nextRenderBuffer
      await engine.drawScene(new Scene(), buffer, 0)

      const { bg } = buffer.buffers
      expect(bg[0]!).toBeGreaterThan(230)
      expect(bg[1]!).toBeLessThan(25)

      engine.destroy()
      test.renderer.destroy()
    },
  )

  it(
    'survives toggling supersampling while a readback map is in flight',
    { timeout: 30_000 },
    async () => {
      const test = await createTestRenderer({ width: 16, height: 8 })
      const engine = new ThreeCliRenderer(test.renderer, {
        width: 16,
        height: 8,
        superSample: SuperSampleType.NONE,
        backgroundColor: RED,
      })
      await engine.init()

      // keypress-style toggle lands while mapAsync is pending; it must not
      // destroy the buffer under the mapping (WGPU aborts the map otherwise)
      const canvas = (engine as unknown as { canvas: { readbackBuffer: GPUBuffer } }).canvas
      const readback = canvas.readbackBuffer
      const originalMapAsync = readback.mapAsync.bind(readback)
      readback.mapAsync = (...args: Parameters<GPUBuffer['mapAsync']>) => {
        const pending = originalMapAsync(...args)
        engine.toggleSuperSampling()
        return pending
      }

      const buffer = test.renderer.nextRenderBuffer
      await expect(engine.drawScene(new Scene(), buffer, 0)).resolves.toBeUndefined()
      // next frame renders through the new mode with the replacement buffer
      await engine.drawScene(new Scene(), buffer, 0)

      engine.destroy()
      test.renderer.destroy()
    },
  )

  it('resizes the render target with the output size', { timeout: 30_000 }, async () => {
    const test = await createTestRenderer({ width: 16, height: 8 })
    const engine = new ThreeCliRenderer(test.renderer, { width: 16, height: 8 })
    await engine.init()

    engine.setSize(24, 12)
    const buffer = test.renderer.nextRenderBuffer
    await engine.drawScene(new Scene(), buffer, 0)

    engine.destroy()
    test.renderer.destroy()
  })
})
