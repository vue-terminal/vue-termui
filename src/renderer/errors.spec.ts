// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { afterEach, describe, expect, it } from 'vitest'
import { createTuiApp } from './index'
import { mockConsoleError } from '../__tests__/mock-warn'
import type { TestRendererSetup } from '@opentui/core/testing'

/**
 * Errors must not crash the terminal app: they are surfaced in OpenTUI's console
 * overlay instead. Component (runtime) errors are routed there and swallowed by
 * a default `app.config.errorHandler`; in dev, compilation errors logged by
 * Vite's module runner via `console.error` also pop the overlay open.
 */
describe('renderer error handling', () => {
  mockConsoleError()

  afterEach(() => {
    delete (globalThis as { __VUE_TERMUI_DEV__?: boolean }).__VUE_TERMUI_DEV__
  })

  it('routes component errors to the console overlay instead of throwing', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
    let shown = 0
    const realShow = test.renderer.console.show.bind(test.renderer.console)
    test.renderer.console.show = () => {
      shown++
      realShow()
    }

    const Boom = defineComponent({
      render() {
        throw new Error('kaboom')
      },
    })
    const app = createTuiApp(test.renderer, Boom)

    // The default error handler swallows the error (no crash) and opens the overlay.
    expect(() => app.mount()).not.toThrow()
    await nextTick()
    expect(shown).toBeGreaterThan(0)
    // The default handler logs the swallowed error to the overlay.
    expect('[vue-termui] Unhandled error').toHaveBeenErrored()

    test.renderer.destroy()
  })

  it('lets apps override the default error handler', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
    const caught: string[] = []
    const Boom = defineComponent({
      render() {
        throw new Error('handled-by-user')
      },
    })
    const app = createTuiApp(test.renderer, Boom)
    app.config.errorHandler = (err) => {
      caught.push(String(err))
    }

    expect(() => app.mount()).not.toThrow()
    await nextTick()
    expect(caught).toEqual(['Error: handled-by-user'])

    test.renderer.destroy()
  })

  it('opens the overlay when an error is logged in dev, and restores console.error on destroy', async () => {
    ;(globalThis as { __VUE_TERMUI_DEV__?: boolean }).__VUE_TERMUI_DEV__ = true
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
    let shown = 0
    const realShow = test.renderer.console.show.bind(test.renderer.console)
    test.renderer.console.show = () => {
      shown++
      realShow()
    }

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('text', null, 'hi') }),
    )
    app.mount()
    await nextTick()
    shown = 0

    // Simulate a compile error logged by Vite's module runner.
    console.error('[vite] (ssr) [vue/compiler-sfc] Unexpected token')
    expect(shown, 'overlay opened on logged error').toBeGreaterThan(0)
    expect('[vite] (ssr) [vue/compiler-sfc] Unexpected token').toHaveBeenErrored()

    // Destroying the renderer restores the original console.error (no leak).
    test.renderer.destroy()
    shown = 0
    console.error('after destroy, must not open overlay')
    expect(shown, 'console.error wrap removed on destroy').toBe(0)
    expect('after destroy, must not open overlay').toHaveBeenErrored()
  })
})
