import {
  defineComponent,
  h,
  inject,
  onMounted,
  onUpdated,
  onUnmounted,
  computed,
} from '@vue/runtime-core'
import type { PropType } from '@vue/runtime-core'
import { colorize } from '../renderer/textColor'
import type { ForegroundColorProp } from '../renderer/textColor'
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
      type: String as PropType<ForegroundColorProp>,
    },
    bgColor: {
      required: false,
      default: 'white',
      type: String as PropType<ForegroundColorProp>,
    },
    width: {
      required: false,
      default: 25,
      type: Number,
    },
    value: {
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
      const w = Math.floor(props.value * (props.width / 100))
      const bg = colorize(type, props.bgColor, 'foreground')
      const fg = colorize(type, props.color, 'foreground')
      return fg.repeat(w) + bg.repeat(props.width - w)
    })

    return () => {
      return h('tui:text', content.value)
    }
  },
})
