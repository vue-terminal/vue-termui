// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp, useExit } from './index'
import type { TestRendererSetup } from '@opentui/core/testing'

/**
 * App lifecycle: `waitUntilExit()` resolves when the renderer is torn down, and
 * `exit()` / the `useExit()` composable tear it down programmatically. OpenTUI
 * owns Ctrl+C, signal handling and terminal restoration (via `CliRendererConfig`
 * and `renderer.destroy()`), so these only wire Vue's view of "the app exited".
 */
describe('app lifecycle', () => {
  it('resolves waitUntilExit() when the renderer is destroyed', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('tui-text', null, 'hi') }),
    )
    app.mount()

    let exited = false
    const done = app.waitUntilExit().then(() => {
      exited = true
    })
    expect(exited).toBe(false)

    test.renderer.destroy()
    await done
    expect(exited).toBe(true)
  })

  it('resolves immediately if the renderer is already destroyed', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('tui-text', null, 'hi') }),
    )
    app.mount()
    test.renderer.destroy()

    await expect(app.waitUntilExit()).resolves.toBeUndefined()
  })

  it('exit() tears down the renderer and resolves waitUntilExit()', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('tui-text', null, 'hi') }),
    )
    app.mount()

    const done = app.waitUntilExit()
    app.exit()
    await done
    expect(test.renderer.isRunning).toBe(false)
  })

  it('useExit() returns a function that exits the app', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let exit: (() => void) | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          exit = useExit()
          return () => h('tui-text', null, 'hi')
        },
      }),
    )
    app.mount()
    await nextTick()

    const done = app.waitUntilExit()
    expect(exit).toBeTypeOf('function')
    exit!()
    await expect(done).resolves.toBeUndefined()
  })
})
