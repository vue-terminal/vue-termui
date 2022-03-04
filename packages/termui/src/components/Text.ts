import chalk, { ForegroundColor } from 'chalk'
import {
  PropType,
  h,
  inject,
  defineComponent,
  onUpdated,
} from '@vue/runtime-core'
import { Styles } from '../styles'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import { colorize } from '../textColor'

const defaultStyle: Styles = {
  flexGrow: 0,
  flexShrink: 0,
  flexDirection: 'row',
}

export const TuiText = defineComponent({
  name: 'TuiText',

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

    function transform(text: string): string {
      if (props.dimmed) {
        text = chalk.dim(text)
      }
      if (props.color) {
        text = colorize(text, props.color, 'foreground')
      }

      if (props.bgColor) {
        text = colorize(text, props.bgColor, 'background')
      }

      if (props.bold) {
        text = chalk.bold(text)
      }

      if (props.italic) {
        text = chalk.italic(text)
      }

      if (props.underline) {
        text = chalk.underline(text)
      }

      if (props.strikethrough) {
        text = chalk.strikethrough(text)
      }

      if (props.inverse) {
        text = chalk.inverse(text)
      }

      return text
    }

    return () => {
      return h(
        'tui-text',
        {
          style: { ...defaultStyle, textWrap: props.wrap },
          internal_transform: transform,
        },
        slots.default?.()
      )
    }
  },
})
