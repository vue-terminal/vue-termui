import chalk, { ForegroundColor } from 'chalk'
import {
  PropType,
  h,
  defineComponent,
  onMounted,
  onUpdated,
  onUnmounted,
} from '@vue/runtime-core'
import type { Styles } from '../renderer/styles'
import { useScheduleUpdate } from '../composables/scheduleUpdate'
import { colorize } from '../renderer/textColor'

export const defaultStyle: Styles = {
  flexGrow: 0,
  flexShrink: 1,
  flexDirection: 'row',
}

export interface TuiTextProps {
  color?: ForegroundColor
  bgColor?: ForegroundColor
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
    const { update } = useScheduleUpdate()

    onMounted(() => {
      update()
    })

    onUpdated(() => {
      update()
    })

    onUnmounted(() => {
      update()
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
