// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from './index'
import type { TestRendererSetup } from '@opentui/core/testing'

/**
 * HMR support relies on `@vitejs/plugin-vue`'s `rerender` path (template-only
 * edits): it swaps a component's render function **in place** and re-renders the
 * existing instance, so component state survives the edit — unlike `reload`,
 * which replaces the component and resets state. These tests assert the custom
 * renderer honours that contract: state preserved, output updated, same
 * instance (no recreation). See the `vue-termui:dev` HMR bridge in `src/vite.ts`.
 */
interface HMRRuntime {
  createRecord(id: string, comp: unknown): void
  rerender(id: string, render: () => unknown): void
}

describe('renderer HMR rerender', () => {
  it('swaps the render function in place, preserving state', async () => {
    const hmr = (globalThis as { __VUE_HMR_RUNTIME__?: HMRRuntime }).__VUE_HMR_RUNTIME__
    expect(hmr, 'Vue dev build should register __VUE_HMR_RUNTIME__').toBeTruthy()

    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 4 })

    // A component registered with the HMR runtime, like a compiled SFC.
    const Comp = defineComponent({
      __hmrId: 'hmr-spec-comp',
      setup: () => ({ n: ref(0) }),
      render(this: { n: number }) {
        return h('tui-text', null, `v1 ${this.n}`)
      },
    })
    hmr!.createRecord('hmr-spec-comp', Comp)

    const app = createTuiApp(
      test.renderer,
      defineComponent({ render: () => h('tui-box', null, [h(Comp)]) }),
    )
    app.mount()
    await nextTick()

    // Simulate user interaction mutating component state.
    const instance = (
      app._instance!.subTree.children as unknown as { component: { setupState: { n: number } } }[]
    )[0]!.component
    instance.setupState.n = 7
    await nextTick()
    await test.renderOnce()
    expect(test.captureCharFrame()).toContain('v1 7')

    // Template-only edit: swap ONLY the render function.
    hmr!.rerender('hmr-spec-comp', function (this: { n: number }) {
      return h('tui-text', null, `v2 ${this.n}`)
    })
    await nextTick()
    await test.renderOnce()

    const frame = test.captureCharFrame()
    expect(frame, 'render function swapped').toContain('v2')
    expect(frame, 'state preserved across rerender').toContain('7')

    const sameInstance =
      (app._instance!.subTree.children as unknown as { component: unknown }[])[0]!.component ===
      instance
    expect(sameInstance, 'instance reused, not recreated').toBe(true)

    test.renderer.destroy()
  })
})
