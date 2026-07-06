// @vitest-environment node
import { TabSelectRenderable } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { defineComponent, h, nextTick, ref } from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { TabSelect, type TabSelectOption } from './TabSelect'
import type { TestRendererSetup } from '@opentui/core/testing'

const options: TabSelectOption[] = [
  { name: 'Home', description: 'Dashboard' },
  { name: 'Files', description: 'File management' },
  { name: 'Settings', description: 'Application settings' },
]

describe('TabSelect', () => {
  it('seeds the renderable with options and the selected index', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const app = createTuiApp(
      test.renderer,
      defineComponent({ setup: () => () => h(TabSelect, { options, modelValue: 1, width: 60 }) }),
    )
    app.mount()
    await nextTick()

    const tabs = test.renderer.root.getChildren()[0] as TabSelectRenderable
    expect(tabs).toBeInstanceOf(TabSelectRenderable)
    expect(tabs.options).toHaveLength(3)
    expect(tabs.getSelectedIndex()).toBe(1)

    test.renderer.destroy()
  })

  it('updates v-model as the user navigates', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const index = ref(0)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(TabSelect, {
              options,
              width: 60,
              modelValue: index.value,
              autofocus: true,
              'onUpdate:modelValue': (i: number) => {
                index.value = i
              },
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressArrow('right')
    await nextTick()
    expect(index.value).toBe(1)

    test.renderer.destroy()
  })

  it('syncs external model changes into the renderable', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const index = ref(0)
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(TabSelect, { options, width: 60, modelValue: index.value }),
      }),
    )
    app.mount()
    await nextTick()

    const tabs = test.renderer.root.getChildren()[0] as TabSelectRenderable
    expect(tabs.getSelectedIndex()).toBe(0)

    index.value = 2
    await nextTick()
    expect(tabs.getSelectedIndex()).toBe(2)

    test.renderer.destroy()
  })

  it('reacts to a changing options list', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const list = ref<TabSelectOption[]>([{ name: 'A', description: 'a' }])
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup: () => () => h(TabSelect, { options: list.value, width: 60, modelValue: 0 }),
      }),
    )
    app.mount()
    await nextTick()

    const tabs = test.renderer.root.getChildren()[0] as TabSelectRenderable
    expect(tabs.options).toHaveLength(1)

    list.value = [
      { name: 'A', description: 'a' },
      { name: 'B', description: 'b' },
      { name: 'C', description: 'c' },
    ]
    await nextTick()
    expect(tabs.options).toHaveLength(3)

    test.renderer.destroy()
  })

  it('emits selected with the chosen option on Enter', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const picked: Array<[string | undefined, number]> = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(TabSelect, {
              options,
              width: 60,
              modelValue: 2,
              autofocus: true,
              onSelected: (opt: TabSelectOption | null, i: number) => picked.push([opt?.name, i]),
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressEnter()
    expect(picked).toEqual([['Settings', 2]])

    test.renderer.destroy()
  })

  it('emits changed with the option on every highlight move', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 60, height: 8 })
    const moves: Array<[string | undefined, number]> = []
    const app = createTuiApp(
      test.renderer,
      defineComponent({
        setup() {
          return () =>
            h(TabSelect, {
              options,
              width: 60,
              modelValue: 0,
              autofocus: true,
              onChanged: (opt: TabSelectOption | null, i: number) => moves.push([opt?.name, i]),
            })
        },
      }),
    )
    app.mount()
    await nextTick()

    test.mockInput.pressArrow('right')
    await nextTick()
    test.mockInput.pressArrow('right')
    await nextTick()
    expect(moves).toEqual([
      ['Files', 1],
      ['Settings', 2],
    ])

    test.renderer.destroy()
  })
})
