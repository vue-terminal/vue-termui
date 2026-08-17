// @vitest-environment node
import { decodePasteBytes } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { onPaste } from './paste'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { PasteEvent } from './paste'
import type { RemoveListener } from '../utils/types'

describe('onPaste', () => {
  // Nothing focusable is ever mounted here: unlike a component's `@paste`, the
  // composable listens on the renderer, so it must fire with no focus at all.
  it('delivers the pasted bytes, decodable to the original text', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    const received: PasteEvent[] = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          onPaste((event) => received.push(event))
          return () => h('tui-box')
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.pasteBracketedText('hello\nworld')

    expect(received).toHaveLength(1)
    expect(decodePasteBytes(received[0]!.bytes)).toBe('hello\nworld')

    app.unmount()
    test.renderer.destroy()
  })

  it('stops listening once the component unmounts', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let calls = 0
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          onPaste(() => calls++)
          return () => h('tui-box')
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.pasteBracketedText('before')
    expect(calls).toBe(1)

    app.unmount()
    await nextTick()

    await test.mockInput.pasteBracketedText('after')
    expect(calls).toBe(1)

    test.renderer.destroy()
  })

  it('early removal detaches only that listener', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 4 })
    let a = 0
    let b = 0
    let removeA: RemoveListener | undefined
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          removeA = onPaste(() => a++)
          onPaste(() => b++)
          return () => h('tui-box')
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.pasteBracketedText('first')
    expect([a, b]).toEqual([1, 1])

    removeA?.()
    await test.mockInput.pasteBracketedText('second')
    expect([a, b]).toEqual([1, 2])

    app.unmount()
    test.renderer.destroy()
  })
})
