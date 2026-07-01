// @vitest-environment node
import { InputRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Input } from './Input'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('Input', () => {
  it('updates the v-model as the user types', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 3 })
    const value = ref('')
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Input, {
              modelValue: value.value,
              focus: true,
              'onUpdate:modelValue': (v: string) => {
                value.value = v
              },
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.typeText('hi')
    await nextTick()
    expect(value.value).toBe('hi')

    test.renderer.destroy()
  })

  it('seeds the renderable with the initial model value', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 3 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Input, { modelValue: 'preset' }),
      }),
    )
    app.mount()
    await nextTick()

    const input = test.renderer.root.getChildren()[0] as InputRenderable
    expect(input).toBeInstanceOf(InputRenderable)
    expect(input.value).toBe('preset')

    test.renderer.destroy()
  })

  it('syncs external model changes into the renderable', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 3 })
    const value = ref('one')
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Input, { modelValue: value.value }),
      }),
    )
    app.mount()
    await nextTick()

    const input = test.renderer.root.getChildren()[0] as InputRenderable
    expect(input.value).toBe('one')

    value.value = 'two'
    await nextTick()
    expect(input.value).toBe('two')

    test.renderer.destroy()
  })
})
