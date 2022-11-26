import chalk, { ForegroundColor } from 'chalk'
import { transform as transformClass } from '../style-shortcuts'
import {
  PropType,
  h,
  inject,
  defineComponent,
  onMounted,
  onUpdated,
  onUnmounted,
} from '@vue/runtime-core'
import type { LiteralUnion } from '../utils'
import type { Styles } from '../renderer/styles'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import { colorize } from '../renderer/textColor'

export const defaultStyle: Styles = {
  flexGrow: 0,
  flexShrink: 1,
  flexDirection: 'row',
}

export interface TuiTextProps {
  color?: LiteralUnion<ForegroundColor, string>
  bgColor?: LiteralUnion<ForegroundColor, string>
  dimmed?: boolean
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  inverse?: boolean
  wrap?: Styles['textWrap']
}

export const TuiText = defineComponent({
  name: 'TuiText',

  props: {
    color: String as PropType<LiteralUnion<ForegroundColor, string>>,
    bgColor: String as PropType<LiteralUnion<ForegroundColor, string>>,
    dimmed: Boolean,
    bold: Boolean,
    italic: Boolean,
    underline: Boolean,
    strikethrough: Boolean,
    inverse: Boolean,
    wrap: String as PropType<Styles['textWrap']>,
    class: String,
  },

  setup(props, { slots, attrs }) {
    ;(props.class || Object.keys(attrs).length) &&
      (props = {
        ...props,
        ...(props.class && transformClass(props.class)),
        ...(Object.keys(attrs).length &&
          transformClass(Object.keys(attrs).join(' '))),
      })

    const scheduleUpdate = inject(scheduleUpdateSymbol)!

    onMounted(scheduleUpdate)

    onUpdated(scheduleUpdate)

    onUnmounted(scheduleUpdate)

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
        'tui:text',
        {
          style: { ...defaultStyle, textWrap: props.wrap },
          internal_transform: transform,
        },
        slots.default?.()
      )
    }
  },
})
