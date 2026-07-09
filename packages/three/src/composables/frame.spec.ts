// @vitest-environment node
import type { CliRenderer } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { describe, expect, it } from 'vitest'
import {
  createNodeOps,
  createRenderer,
  h,
  nextTick,
  rendererInjectionKey,
  type Component,
} from 'vue-termui'
import { onFrame } from './frame'

function mountApp(renderer: CliRenderer, component: Component) {
  const { createApp } = createRenderer(createNodeOps(renderer))
  const app = createApp(component)
  app.provide(rendererInjectionKey, renderer)
  app.mount(renderer.root)
  return app
}

describe('onFrame', () => {
  it('runs every frame and stops on unmount', async () => {
    const test = await createTestRenderer({ width: 8, height: 4 })
    const deltas: number[] = []
    const app = mountApp(test.renderer, {
      setup() {
        onFrame((deltaMs) => {
          deltas.push(deltaMs)
        })
        return () => h('tui-text', 'frames')
      },
    })
    await nextTick()

    await test.renderOnce()
    await test.renderOnce()
    expect(deltas.length).toBeGreaterThanOrEqual(2)
    expect(deltas.every((delta) => typeof delta === 'number')).toBe(true)

    const count = deltas.length
    app.unmount()
    await test.renderOnce()
    expect(deltas.length).toBe(count)

    test.renderer.destroy()
  })

  it('can be removed manually', async () => {
    const test = await createTestRenderer({ width: 8, height: 4 })
    let calls = 0
    let remove!: () => void
    mountApp(test.renderer, {
      setup() {
        remove = onFrame(() => {
          calls++
        })
        return () => h('tui-text', 'frames')
      },
    })
    await nextTick()

    await test.renderOnce()
    expect(calls).toBeGreaterThanOrEqual(1)

    const count = calls
    remove()
    await test.renderOnce()
    expect(calls).toBe(count)

    test.renderer.destroy()
  })
})
