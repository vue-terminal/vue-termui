// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { onKeyDown } from './keyboard'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { KeyEvent } from './keyboard'

describe('onKeyDown', () => {
  it('invokes the handler with the parsed key event', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const seen: KeyEvent[] = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          onKeyDown((event) => seen.push(event))
          return () => h('tui-text', null, 'listening')
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressKey('a')
    expect(seen).toHaveLength(1)
    expect(seen[0]!.name).toBe('a')

    test.renderer.destroy()
  })

  it('stops listening once the owning component unmounts', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let count = 0
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          onKeyDown(() => count++)
          return () => h('tui-text', null, 'listening')
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressKey('a')
    expect(count).toBe(1)

    app.unmount()
    await nextTick()
    test.mockInput.pressKey('b')
    expect(count).toBe(1)

    test.renderer.destroy()
  })

  it('returns a function that removes the listener early', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let count = 0
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          const stop = onKeyDown(() => count++)
          // Remove immediately; no key should ever be counted.
          stop()
          return () => h('tui-text', null, 'listening')
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressKey('a')
    expect(count).toBe(0)

    test.renderer.destroy()
  })
})
