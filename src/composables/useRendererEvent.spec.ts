// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { CliRenderEvents } from '@opentui/core'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { useRendererEvent } from './useRendererEvent'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('useRendererEvent', () => {
  it('multiplexes many subscribers onto a single renderer listener', async () => {
    // Regression: each subscriber used to add its own renderer.on() listener,
    // so 11+ focusable components tripped Node's EventEmitter warning
    // ("Possible EventEmitter memory leak detected. 11 focused_renderable
    // listeners added"). All subscribers to one event must share a single
    // underlying listener.
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const SUBSCRIBERS = 15
    let calls = 0
    let originalListenerCount = 0
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          originalListenerCount = test.renderer.listenerCount(CliRenderEvents.FOCUSED_RENDERABLE)
          for (let i = 0; i < SUBSCRIBERS; i++) {
            useRendererEvent(CliRenderEvents.FOCUSED_RENDERABLE, () => {
              calls++
            })
          }
          return () => h('box')
        },
      }),
    )
    app.mount()
    await nextTick()

    expect(test.renderer.listenerCount(CliRenderEvents.FOCUSED_RENDERABLE)).toBe(1)

    // The single underlying listener still fans out to every subscriber.
    test.renderer.emit(CliRenderEvents.FOCUSED_RENDERABLE)
    expect(calls).toBe(SUBSCRIBERS)

    app.unmount()
    await nextTick()
    expect(test.renderer.listenerCount(CliRenderEvents.FOCUSED_RENDERABLE)).toBe(
      originalListenerCount,
    )

    test.renderer.destroy()
  })

  it('early removal only detaches that subscriber, keeping the shared listener', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let a = 0
    let b = 0
    let removeA: (() => void) | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          removeA = useRendererEvent(CliRenderEvents.FOCUSED_RENDERABLE, () => {
            a++
          })
          useRendererEvent(CliRenderEvents.FOCUSED_RENDERABLE, () => {
            b++
          })
          return () => h('box')
        },
      }),
    )
    app.mount()
    await nextTick()

    expect(test.renderer.listenerCount(CliRenderEvents.FOCUSED_RENDERABLE)).toBe(1)

    removeA!()
    test.renderer.emit(CliRenderEvents.FOCUSED_RENDERABLE)
    expect(a).toBe(0)
    expect(b).toBe(1)
    // Still one subscriber left, so the shared listener stays attached.
    expect(test.renderer.listenerCount(CliRenderEvents.FOCUSED_RENDERABLE)).toBe(1)

    test.renderer.destroy()
  })
})
