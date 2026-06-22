// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { mountApp } from './index'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('mountApp', () => {
  it('stops updating the tree once the renderer is destroyed', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 5 })
    const label = ref('alive')
    const App = defineComponent({
      setup() {
        return () => h('text', null, label.value)
      },
    })

    const app = mountApp(test.renderer, App)
    const errors: unknown[] = []
    app.config.errorHandler = (err) => {
      errors.push(err)
    }

    await test.renderOnce()
    expect(test.captureCharFrame()).toContain('alive')

    // Destroying the renderer tears down native text buffers. A reactive update
    // afterwards must not patch them (would throw "TextBuffer is destroyed").
    test.renderer.destroy()
    label.value = 'dead'
    await nextTick()

    expect(errors).toEqual([])
  })
})
