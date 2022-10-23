import {
  defineComponent,
  h,
  computed,
  Comment,
  Fragment,
} from '@vue/runtime-core'
import { ForegroundColor } from 'chalk'
import type { PropType, VNode } from '@vue/runtime-core'
import type { LiteralUnion } from '../utils'
import { TuiBox } from './Box'
import { TuiText } from './Text'
import { Styles } from '../renderer/styles'
import { onKeyData } from '../composables/keyboard'

export const TuiTabs = defineComponent({
  props: {
    modelValue: {
      type: [String, Number],
      required: true,
    },
    flexDirection: {
      type: String as PropType<Styles['flexDirection']>,
      default: 'row',
    },
    color: {
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
      default: 'white',
    },
    bgColor: {
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
      default: 'black',
    },
    activeColor: {
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
      default: 'white',
    },
    activeBgColor: {
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
      default: 'blue',
    },
    useTab: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['onChange', 'update:modelValue'],
  setup(props, { emit, slots }) {
    const isColumn = computed(
      () =>
        props.flexDirection === 'column' ||
        props.flexDirection === 'column-reverse'
    )

    const keyMap = computed(() => ({
      previous: isColumn.value ? 'ArrowUp' : 'ArrowLeft',
      next: isColumn.value ? 'ArrowDown' : 'ArrowRight',
    }))

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

    function toggleTab(index: number) {
      emit('update:modelValue', index)
      emit('onChange', index)
    }

    onKeyData(
      [
        keyMap.value.previous,
        keyMap.value.next,
        ...(props.useTab ? ['Tab'] : []),
      ],
      ({ key }) => {
        const step = {
          [keyMap.value.previous]: -1,
          [keyMap.value.next]: 1,
          Tab: 1,
        }[key]
        const index = +props.modelValue + step
        const toggleIndex =
          index < 0
            ? children.value.length - 1
            : index > children.value.length - 1
            ? 0
            : index
        toggleTab(toggleIndex)
      }
    )

    function normalizeChild() {
      return children.value.map((child, index) => {
        const isActive = +props.modelValue === index
        return h(
          TuiBox,
          {
            flexGrow: 1,
          },
          {
            default: () =>
              h(
                TuiText,
                {
                  color: isActive ? props.activeColor : props.color,
                  bgColor: isActive ? props.activeBgColor : props.bgColor,
                },
                { default: () => child }
              ),
          }
        )
      })
    }

    return () => {
      return h(
        TuiBox,
        {
          flexDirection: props.flexDirection,
          width: '100%',
          height: '100%',
        },
        { default: normalizeChild }
      )
    }
  },
})

export const TuiTab = defineComponent({
  props: {
    name: {
      type: String,
      default: '',
    },
  },
  setup(props, { slots }) {
    return () => {
      return h(Fragment, {}, [
        h('tui:text', {}, ' '),
        h('tui:text', {}, slots?.default?.() ?? props.name),
        h('tui:text', {}, ' '),
      ])
    }
  },
})
