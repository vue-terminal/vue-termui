// @vitest-environment node
import { SelectRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { Select, type SelectOption } from './Select'
import type { TestRendererSetup } from '@opentui/core/testing'

const options: SelectOption[] = [{ name: 'First' }, { name: 'Second' }, { name: 'Third' }]

describe('Select', () => {
  it('seeds the renderable with options and the selected index', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 8 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(Select, { options, modelValue: 1 }) }),
    )
    app.mount()
    await nextTick()

    const select = test.renderer.root.getChildren()[0] as SelectRenderable
    expect(select).toBeInstanceOf(SelectRenderable)
    expect(select.options).toHaveLength(3)
    expect(select.getSelectedIndex()).toBe(1)

    test.renderer.destroy()
  })

  it('updates v-model as the user navigates', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 8 })
    const index = ref(0)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Select, {
              options,
              modelValue: index.value,
              focus: true,
              'onUpdate:modelValue': (i: number) => {
                index.value = i
              },
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressArrow('down')
    await nextTick()
    expect(index.value).toBe(1)

    test.renderer.destroy()
  })

  it('syncs external model changes into the renderable', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 8 })
    const index = ref(0)
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(Select, { options, modelValue: index.value }) }),
    )
    app.mount()
    await nextTick()

    const select = test.renderer.root.getChildren()[0] as SelectRenderable
    expect(select.getSelectedIndex()).toBe(0)

    index.value = 2
    await nextTick()
    expect(select.getSelectedIndex()).toBe(2)

    test.renderer.destroy()
  })

  it('reacts to a changing options list', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 8 })
    const list = ref<SelectOption[]>([{ name: 'A' }])
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(Select, { options: list.value, modelValue: 0 }) }),
    )
    app.mount()
    await nextTick()

    const select = test.renderer.root.getChildren()[0] as SelectRenderable
    expect(select.options).toHaveLength(1)

    list.value = [{ name: 'A' }, { name: 'B' }, { name: 'C' }]
    await nextTick()
    expect(select.options).toHaveLength(3)

    test.renderer.destroy()
  })

  it('emits select with the chosen option on Enter', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 30, height: 8 })
    const picked: Array<[string | undefined, number]> = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(Select, {
              options,
              modelValue: 2,
              focus: true,
              onSelect: (opt: SelectOption | null, i: number) => picked.push([opt?.name, i]),
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressEnter()
    expect(picked).toEqual([['Third', 2]])

    test.renderer.destroy()
  })
})
