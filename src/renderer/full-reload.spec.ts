// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h } from '@vue/runtime-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTuiApp, disposePreviousDevApp } from './index'
import type { TestRendererSetup } from '@opentui/core/testing'

/**
 * On a Vite full reload (an edit with no HMR boundary) the module runner clears
 * its cache and re-imports the entry, so `createApp` runs again. Before it builds
 * the new renderer it calls {@link disposePreviousDevApp} to tear down the prior
 * app — freeing the terminal and running `onUnmounted` — WITHOUT triggering the
 * dev teardown that closes the Vite server and exits the process (a reload must
 * not quit). See the dev full-reload bridge in `./index`.
 */
describe('disposePreviousDevApp', () => {
  const g = globalThis as {
    __VUE_TERMUI_DEV__?: boolean
    __VUE_TERMUI_DEV_DESTROY__?: () => void
    __VUE_TERMUI_TEARDOWN__?: () => void
  }

  afterEach(() => {
    g.__VUE_TERMUI_DEV__ = undefined
    g.__VUE_TERMUI_DEV_DESTROY__ = undefined
    g.__VUE_TERMUI_TEARDOWN__ = undefined
  })

  it('destroys the previous app but does not run the exit teardown', async () => {
    g.__VUE_TERMUI_DEV__ = true
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('text', null, 'v1') }),
    )
    app.mount()

    // `createTuiApp` registered the disposer for this renderer under the dev flag.
    expect(g.__VUE_TERMUI_DEV_DESTROY__, 'disposer registered in dev').toBeTypeOf('function')

    const destroy = vi.spyOn(test.renderer, 'destroy')
    const teardown = vi.fn()
    g.__VUE_TERMUI_TEARDOWN__ = teardown

    disposePreviousDevApp()

    expect(destroy, 'previous renderer destroyed').toHaveBeenCalledTimes(1)
    expect(teardown, 'reload must not exit the process').toHaveBeenCalledTimes(0)
    expect(g.__VUE_TERMUI_TEARDOWN__, 'teardown restored for the next app').toBe(teardown)
  })

  it('is a no-op when no previous app is registered', () => {
    g.__VUE_TERMUI_TEARDOWN__ = vi.fn()
    expect(() => disposePreviousDevApp()).not.toThrow()
    expect(g.__VUE_TERMUI_TEARDOWN__).toHaveBeenCalledTimes(0)
  })
})

/**
 * Before disposing the previous dev app, its current router location is stashed
 * on the `VUE_TERMUI_START_LOCATION` global so the re-imported entry can push it
 * back and land on the same screen after a full reload (see the capture in
 * `createTuiApp` and the seed in `./index`).
 */
describe('start location capture', () => {
  const g = globalThis as {
    __VUE_TERMUI_DEV__?: boolean
    __VUE_TERMUI_DEV_DESTROY__?: () => void
    __VUE_TERMUI_TEARDOWN__?: () => void
  }

  afterEach(() => {
    g.__VUE_TERMUI_DEV__ = undefined
    g.__VUE_TERMUI_DEV_DESTROY__ = undefined
    g.__VUE_TERMUI_TEARDOWN__ = undefined
  })

  it('captures the router location before a full reload', async () => {
    g.__VUE_TERMUI_DEV__ = true
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('text', null, 'v1') }),
    )
    // vue-router sets `$router` on install; fake the shape the capture reads.
    app.config.globalProperties.$router = { currentRoute: { value: { fullPath: '/select' } } }
    app.mount()

    globalThis.VUE_TERMUI_START_LOCATION = '/'
    disposePreviousDevApp()

    expect(globalThis.VUE_TERMUI_START_LOCATION).toBe('/select')
  })

  it('leaves the start location untouched when no router is installed', async () => {
    g.__VUE_TERMUI_DEV__ = true
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('text', null, 'v1') }),
    )
    app.mount()

    globalThis.VUE_TERMUI_START_LOCATION = '/keep'
    disposePreviousDevApp()

    expect(globalThis.VUE_TERMUI_START_LOCATION).toBe('/keep')
  })

  it('leaves the start location untouched when $router lacks a current route', async () => {
    g.__VUE_TERMUI_DEV__ = true
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('text', null, 'v1') }),
    )
    // A foreign or partially-initialized `$router` with no `currentRoute`.
    app.config.globalProperties.$router = {}
    app.mount()

    globalThis.VUE_TERMUI_START_LOCATION = '/keep'
    disposePreviousDevApp()

    expect(globalThis.VUE_TERMUI_START_LOCATION).toBe('/keep')
  })
})
