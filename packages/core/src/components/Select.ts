import {
  h,
  provide,
  inject,
  defineComponent,
  onMounted,
  onUpdated,
  onUnmounted,
  Fragment,
  computed,
  Comment,
} from '@vue/runtime-core'
import type {
  PropType,
  InjectionKey,
  VNode,
  ComputedRef,
} from '@vue/runtime-core'
import { TuiBox } from './Box'
import { TuiText } from './Text'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import { onKeyData } from '../composables/keyboard'
import type { ForegroundColorProp } from '../renderer/textColor'
import { KeyDataEventKey } from '../input/types'

export interface TuiSelectIndicator {
  /**
   * Figure of indicator.
   *
   * @default ❯
   */
  figure: string
  /**
   * Indicator figure color.
   *
   * @default ❯
   */
  color: ForegroundColorProp
}

export const tuiSelectSymbol = Symbol('vue-termui:select') as InjectionKey<{
  activeName: ComputedRef<string | number>
  indicator: TuiSelectIndicator
}>

export const TuiSelect = defineComponent({
  name: 'TuiSelect',
  props: {
    modelValue: {
      type: [String, Number],
      required: true,
    },
    indicator: {
      type: Object as PropType<TuiSelectIndicator>,
      default: {
        figure: '❯',
        color: 'blue',
      },
    },
    submitKey: {
      type: [String, Array] as PropType<KeyDataEventKey | KeyDataEventKey[]>,
      required: false,
      // Space key
      default: [' '],
    },
  },
  emit: ['update:modelValue', 'submit'],
  setup(props, { slots, emit }) {
    const children = computed(() => {
      const defaultSlots = slots.default?.()
      const children = defaultSlots
        ?.filter((child) => child.type !== Comment)
        ?.reduce(
          (nodeList: VNode[], node: VNode) =>
            node.type === Fragment
              ? [...nodeList, ...(node.children as VNode[])]
              : [...nodeList, node],
          []
        )

      return children ?? []
    })

    const activeName = computed(() => props.modelValue)
    const activeIndex = computed(() =>
      children.value?.findIndex(
        (item) => item?.props?.value === activeName.value
      )
    )

    const scheduleUpdate = inject(scheduleUpdateSymbol)!

    onMounted(scheduleUpdate)

    onUpdated(scheduleUpdate)

    onUnmounted(scheduleUpdate)

    provide(tuiSelectSymbol, {
      activeName: activeName,
      indicator: props.indicator,
    })

    const stopDownInput = onKeyData(['ArrowDown', 'ArrowRight'], () => {
      const index =
        activeIndex.value! + 1 > children.value.length! - 1
          ? 0
          : activeIndex.value! + 1
      emit('update:modelValue', children.value?.[index]?.props?.value)
    })

    const stopUpInput = onKeyData(['ArrowUp', 'ArrowLeft'], () => {
      const index =
        activeIndex.value! - 1 < 0
          ? children.value.length! - 1
          : activeIndex.value! - 1
      emit('update:modelValue', children.value?.[index]?.props?.value)
    })

    const stopSubmitInput = onKeyData(props.submitKey, () => {
      stopDownInput()
      stopUpInput()
      stopSubmitInput()
      emit('submit', activeName.value, activeIndex.value)
    })

    return () => {
      return h(
        TuiBox,
        {
          flexDirection: 'column',
        },
        () => slots.default?.()
      )
    }
  },
})

export const TuiOption = defineComponent({
  name: 'TuiOption',

  props: {
    label: {
      type: [String, Number],
      required: false,
    },
    value: [String, Number],
  },

  setup(props, { slots }) {
    const tuiSelectRoot = inject(tuiSelectSymbol)!
    return () => {
      const isActive = props.value === tuiSelectRoot.activeName.value
      const { color, figure } = tuiSelectRoot.indicator
      return h(TuiBox, {}, () => [
        // Indicator
        h(
          TuiText,
          {
            color,
          },
          () => (isActive ? figure : ' ') + ' '
        ),
        // Option
        slots
          .default?.({
            isActive,
          })
          ?.filter((child) => child.type !== Comment)?.length
          ? h(
              Fragment,
              slots.default?.({
                isActive,
              })
            )
          : h(TuiText, () => props.label),
      ])
    }
  },
})
