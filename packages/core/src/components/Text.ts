import chalk, { ForegroundColor } from 'chalk'
import { transformClassToStyleProps } from '../style-shortcuts'
import {
  PropType,
  h,
  inject,
  defineComponent,
  onMounted,
  onUpdated,
  onUnmounted,
  computed,
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

  setup(props, { slots }) {
    const propsWithClasses = computed(() =>
      props.class
        ? {
            ...props,
            ...transformClassToStyleProps(props.class),
          }
        : props
    )

    const scheduleUpdate = inject(scheduleUpdateSymbol)!

    onMounted(scheduleUpdate)

    onUpdated(scheduleUpdate)

    onUnmounted(scheduleUpdate)

    function transform(text: string): string {
      if (propsWithClasses.value.dimmed) {
        text = chalk.dim(text)
      }
      if (propsWithClasses.value.color) {
        text = colorize(text, propsWithClasses.value.color, 'foreground')
      }

      if (propsWithClasses.value.bgColor) {
        text = colorize(text, propsWithClasses.value.bgColor, 'background')
      }

      if (propsWithClasses.value.bold) {
        text = chalk.bold(text)
      }

      if (propsWithClasses.value.italic) {
        text = chalk.italic(text)
      }

      if (propsWithClasses.value.underline) {
        text = chalk.underline(text)
      }

      if (propsWithClasses.value.strikethrough) {
        text = chalk.strikethrough(text)
      }

      if (propsWithClasses.value.inverse) {
        text = chalk.inverse(text)
      }

      return text
    }

    return () => {
      return h(
        'tui:text',
        {
          style: { ...defaultStyle, textWrap: propsWithClasses.value.wrap },
          internal_transform: transform,
        },
        slots.default?.()
      )
    }
  },
})
