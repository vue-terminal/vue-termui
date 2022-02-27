import { ForegroundColor } from 'chalk'
import { PropType, h, inject } from '@vue/runtime-core'
import { Styles } from '../styles'
import { scheduleUpdateSymbol } from '../injectionSymbols'

export const Span = defineComponent({
  name: 'Span',

  props: {
    color: String as PropType<ForegroundColor>,
    bgColor: String as PropType<ForegroundColor>,
    dimmed: Boolean,
    bold: Boolean,
    italic: Boolean,
    underline: Boolean,
    strikethrough: Boolean,
    inverse: Boolean,
    wrap: String as PropType<Styles['textWrap']>,
  },

  setup(props, { slots }) {
    const scheduleUpdate = inject(scheduleUpdateSymbol)!
    onUpdated(() => {
      scheduleUpdate()
    })
    return () => {
      return h('tui-text', slots.default?.())
    }
  },
})
