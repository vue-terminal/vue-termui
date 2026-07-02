// @vitest-environment node
import { TextareaRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it, vi } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Textarea } from './Textarea'
import type { TestRendererSetup } from '@opentui/core/testing'

describe('Textarea', () => {
  it('updates the v-model as the user types', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 6 })
    const value = ref('')
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Textarea, {
              modelValue: value.value,
              autofocus: true,
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
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 6 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(Textarea, { modelValue: 'preset' }),
      }),
    )
    app.mount()
    await nextTick()

    const textarea = test.renderer.root.getChildren()[0] as TextareaRenderable
    expect(textarea).toBeInstanceOf(TextareaRenderable)
    expect(textarea.plainText).toBe('preset')

    test.renderer.destroy()
  })

  it('inserts a newline on Enter (multi-line), without submitting', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 6 })
    const value = ref('')
    const onSubmit = vi.fn()
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Textarea, {
              modelValue: value.value,
              autofocus: true,
              onSubmit,
              'onUpdate:modelValue': (v: string) => {
                value.value = v
              },
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.typeText('a')
    test.mockInput.pressEnter()
    await test.mockInput.typeText('b')
    await nextTick()

    expect(value.value).toBe('a\nb')
    expect(onSubmit).toHaveBeenCalledTimes(0)

    test.renderer.destroy()
  })

  it('emits submit with the current text on Meta+Enter', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 6 })
    const value = ref('')
    const onSubmit = vi.fn()
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Textarea, {
              modelValue: value.value,
              autofocus: true,
              onSubmit,
              'onUpdate:modelValue': (v: string) => {
                value.value = v
              },
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    await test.mockInput.typeText('hello')
    test.mockInput.pressEnter({ meta: true })
    await nextTick()

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith('hello')

    test.renderer.destroy()
  })
})
