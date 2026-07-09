// @vitest-environment node
import type { BoxRenderable, CliRenderer } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { PerspectiveCamera, Scene } from 'three'
import { describe, expect, it, vi } from 'vitest'
import {
  createNodeOps,
  createRenderer,
  h,
  nextTick,
  rendererInjectionKey,
  type Component,
} from 'vue-termui'
import { SuperSampleType } from '../canvas'
import { ThreeRenderable } from '../ThreeRenderable'
import { Three } from './Three'

function mountApp(renderer: CliRenderer, component: Component) {
  const { createApp } = createRenderer(createNodeOps(renderer))
  const app = createApp(component)
  app.provide(rendererInjectionKey, renderer)
  app.mount(renderer.root)
  return app
}

describe('Three', () => {
  it('mounts a ThreeRenderable inside its box', async () => {
    const test = await createTestRenderer({ width: 16, height: 8 })
    const scene = new Scene()
    mountApp(test.renderer, () => h(Three, { scene }))
    await nextTick()

    const box = test.renderer.root.getChildren()[0] as BoxRenderable
    const renderable = box.getChildren()[0] as ThreeRenderable
    expect(renderable).toBeInstanceOf(ThreeRenderable)
    expect(renderable.getScene()).toBe(scene)

    test.renderer.destroy()
  })

  // Skipped on CI: renderOnce lazily creates a real GPU device, which can
  // native-crash the worker on GPU-less runners (see WGPURenderer.spec.ts).
  it.skipIf(process.env.CI)(
    'applies the camera and renderer options',
    { timeout: 30_000 },
    async () => {
      const test = await createTestRenderer({ width: 16, height: 8 })
      const scene = new Scene()
      const camera = new PerspectiveCamera(45, 1, 0.1, 100)
      mountApp(test.renderer, () =>
        h(Three, {
          scene,
          camera,
          rendererOptions: { superSample: SuperSampleType.NONE },
        }),
      )
      await nextTick()

      const box = test.renderer.root.getChildren()[0] as BoxRenderable
      const renderable = box.getChildren()[0] as ThreeRenderable
      expect(renderable.getActiveCamera()).toBe(camera)

      // the frame callback initializes the engine lazily, then renders '█' cells
      await vi.waitFor(
        async () => {
          await test.renderOnce()
          expect(test.captureCharFrame()).toContain('█')
        },
        { timeout: 20_000, interval: 50 },
      )

      test.renderer.destroy()
    },
  )

  it('destroys the renderable on unmount', async () => {
    const test = await createTestRenderer({ width: 16, height: 8 })
    const app = mountApp(test.renderer, () => h(Three, { scene: new Scene() }))
    await nextTick()

    const box = test.renderer.root.getChildren()[0] as BoxRenderable
    const renderable = box.getChildren()[0] as ThreeRenderable

    app.unmount()
    expect(renderable.isDestroyed).toBe(true)

    test.renderer.destroy()
  })
})
