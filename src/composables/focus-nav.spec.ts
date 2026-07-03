// @vitest-environment node
import { createTestRenderer } from '@opentui/core/testing'
import {
  computed,
  defineComponent,
  h,
  nextTick,
  onMounted,
  ref,
  shallowRef,
} from '@vue/runtime-core'
import { describe, expect, it } from 'vitest'
import { createTuiApp } from '../renderer/index'
import { onKeyDown } from './keyboard'
import { useCurrentFocusedElement } from './focus'
import type { Renderable } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'

/**
 * Integration test for the playground's sidebar pattern: a column of focusable
 * links navigated with ↑/↓ where Enter "pushes" the focused route. Mirrors
 * `playground/src/components/Sidebar.vue` so that behaviour is guarded even
 * though the interactive TUI can't run in CI.
 */
const routes = ['/a', '/b', '/c']

interface LinkInstance {
  focus: () => void
  focused: boolean
}

const Link = defineComponent({
  props: { label: { type: String, required: true } },
  setup(props, { expose }) {
    const el = shallowRef<Renderable | null>(null)
    const currentFocused = useCurrentFocusedElement()
    const focused = computed(() => !!el.value && currentFocused.value === el.value)
    expose({ focus: () => el.value?.focus(), focused })
    return () =>
      h(
        'box',
        {
          ref: (c: unknown) => {
            el.value = (c as Renderable | null) ?? null
          },
          focusable: true,
        },
        [h('text', null, `${focused.value ? '>' : ' '} ${props.label}`)],
      )
  },
})

describe('sidebar focus navigation', () => {
  it('focuses the first link, moves with arrows, and pushes on Enter', async () => {
    const test: TestRendererSetup = await createTestRenderer({ width: 20, height: 8 })
    const links = ref<Array<LinkInstance | null>>([])
    const pushed: string[] = []

    const focusedIndex = (): number => links.value.findIndex((l) => l?.focused)
    const focusAt = (i: number): void => {
      const n = routes.length
      links.value[((i % n) + n) % n]?.focus()
    }

    const Sidebar = defineComponent({
      setup() {
        onMounted(async () => {
          await nextTick()
          focusAt(0)
        })
        onKeyDown((key) => {
          const i = focusedIndex()
          if (i < 0) return
          if (key.name === 'down') focusAt(i + 1)
          else if (key.name === 'up') focusAt(i - 1)
          else if (key.name === 'return') pushed.push(routes[i]!)
        })
        return () =>
          h(
            'box',
            { flexDirection: 'column' },
            routes.map((route, i) =>
              h(Link, {
                key: route,
                label: route,
                ref: (el: unknown) => {
                  links.value[i] = el as LinkInstance | null
                },
              }),
            ),
          )
      },
    })

    const app = createTuiApp(test.renderer, Sidebar)
    app.mount()
    await nextTick()
    await nextTick()

    // First link auto-focused.
    expect(focusedIndex()).toBe(0)

    // Arrow down moves focus; up wraps to the end.
    test.mockInput.pressArrow('down')
    await nextTick()
    expect(focusedIndex()).toBe(1)

    test.mockInput.pressArrow('up')
    test.mockInput.pressArrow('up')
    await nextTick()
    expect(focusedIndex()).toBe(routes.length - 1)

    // Enter pushes the focused route.
    test.mockInput.pressEnter()
    expect(pushed).toEqual(['/c'])

    test.renderer.destroy()
  })
})
