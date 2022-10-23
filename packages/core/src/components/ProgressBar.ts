import {
  defineComponent,
  h,
  inject,
  onMounted,
  onUpdated,
  onUnmounted,
  computed,
} from '@vue/runtime-core'
import type { ForegroundColor } from 'chalk'
import type { PropType } from '@vue/runtime-core'
import type { LiteralUnion } from '../utils'
import { colorize } from '../renderer/textColor'
import { scheduleUpdateSymbol } from '../injectionSymbols'

const FIGURES = {
  basic: '█',
  shade: '▓',
} as const

type FigureType = keyof typeof FIGURES

export const TuiProgressBar = defineComponent({
  name: 'TuiProgressBar',

  props: {
    color: {
      required: false,
      default: 'blue',
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
    },
    bgColor: {
      required: false,
      default: 'white',
      type: String as PropType<LiteralUnion<ForegroundColor, string>>,
    },
    barWidth: {
      required: false,
      default: 25,
      type: Number,
    },
    modelValue: {
      required: true,
      type: Number,
    },
    type: {
      required: false,
      type: String as PropType<FigureType>,
      default: 'basic',
    },
  },

  setup(props) {
    const scheduleUpdate = inject(scheduleUpdateSymbol)!

    onMounted(scheduleUpdate)

    onUpdated(scheduleUpdate)

    onUnmounted(scheduleUpdate)

    const content = computed(() => {
      const type = FIGURES[props.type]
      const w = props.modelValue * (props.barWidth / 100)
      const bg = colorize(type, props.bgColor, 'foreground')
      const fg = colorize(type, props.color, 'foreground')

      return [...Array(props.barWidth)]
        .map((_, i: number) => (i < w ? fg : bg))
        .join('')
    })

    return () => {
      return h('tui:text', content.value)
    }
  },
})
