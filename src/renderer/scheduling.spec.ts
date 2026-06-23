// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNodeOps } from './nodeOps'
import { createTuiApp } from './index'
import { onKeyDown } from '../composables/keyboard'
import { useFocus } from '../composables/focus'
import type { TestRendererSetup } from '@opentui/core/testing'

// Regression guard for the "one-keystroke-late" bug.
//
// OpenTUI renders on demand: a mutation must call `requestRender()` for the
// screen to repaint. Several of our node operations relied on OpenTUI's own
// property setters to do that — but `setElementText` (the lone-string-child
// path) sets `TextRenderable.content`, whose setter does NOT request a render,
// and `insert` / `remove` likewise don't. So a reactive change that only
// touched text content scheduled no render at all and the screen updated only
// on the *next* incidental render (e.g. the next keystroke).
//
// On top of that, OpenTUI coalesces requests behind an `updateScheduled` flag
// it clears a microtask after the in-flight frame tears down; a render
// requested synchronously by a key handler (e.g. `focus()`) leaves that flag
// set across Vue's flush, swallowing the render our mutations request. The fix
// schedules a single coalesced render in a microtask — after Vue's flush and
// after that flag clears — so the request always lands.
describe('render scheduling', () => {
  let test: TestRendererSetup

  beforeEach(async () => {
    test = await createTestRenderer({ width: 24, height: 8 })
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  it('schedules a deferred, coalesced render after a batch of mutations', async () => {
    // OpenTUI requests a render synchronously from most of its setters, but that
    // request is dropped if a render is already "scheduled" for the current tick
    // (the case a synchronous `focus()` creates). The fix is an extra render
    // requested from a microtask — after the flush and after OpenTUI's coalescing
    // flag clears — so it can never be swallowed. Guard that deferred request and
    // its coalescing here (the synchronous-only behavior left nothing deferred).
    const ops = createNodeOps(test.renderer)
    const box = ops.createElement('box')
    const text = ops.createElement('text')
    ops.insert(text, box)
    ops.insert(box, test.renderer.root)
    await Promise.resolve()
    await new Promise<void>((resolve) => process.nextTick(resolve))

    const spy = vi.spyOn(test.renderer, 'requestRender')

    // Several mutations in one synchronous batch (as one Vue flush would apply).
    ops.setElementText(text, 'hello')
    ops.patchProp(box, 'backgroundColor', undefined, '#222')
    const synchronous = spy.mock.calls.length

    await Promise.resolve()
    await Promise.resolve()
    const deferred = spy.mock.calls.length - synchronous

    // Exactly one render is queued for the whole batch, and it lands after the
    // synchronous turn — i.e. after the flush, where it survives coalescing.
    expect(deferred).toBe(1)

    spy.mockRestore()
  })

  it('repaints a reactive text change without a manual render', async () => {
    const { render } = createRenderer(createNodeOps(test.renderer))
    const label = ref('first')
    const App = defineComponent({
      setup() {
        return () => h('box', null, [h('text', null, label.value)])
      },
    })
    render(h(App), test.renderer.root)
    await test.flush()
    expect(test.captureCharFrame()).toContain('first')

    // No manual `renderOnce()` here: the mutation itself must drive the render.
    label.value = 'second'
    await nextTick()
    await test.flush()

    const frame = test.captureCharFrame()
    expect(frame).toContain('second')
    expect(frame).not.toContain('first')
  })

  it('reflects a focus-driven reactive change in the same keystroke', async () => {
    // Mirrors the Sidebar arrow-nav case: a key handler that both calls an
    // imperative `focus()` (which synchronously requests a render) and triggers
    // a reactive `focused` change consumed by the rendered output.
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          const a = useFocus({ autoFocus: true })
          const b = useFocus()
          onKeyDown((key) => {
            if (key.name === 'x') b.focus()
          })
          return () =>
            h('box', null, [
              h('box', { ref: a.ref }, [h('text', null, a.focused.value ? 'A:on' : 'A:off')]),
              h('box', { ref: b.ref }, [h('text', null, b.focused.value ? 'B:on' : 'B:off')]),
            ])
        },
      }),
    )
    app.mount()
    await nextTick()
    await test.flush()
    expect(test.captureCharFrame()).toContain('A:on')

    test.mockInput.pressKey('x')
    await test.flush()

    const frame = test.captureCharFrame()
    expect(frame).toContain('B:on')
    expect(frame).toContain('A:off')
  })
})
