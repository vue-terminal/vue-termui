import chalk, { ForegroundColorName } from 'chalk'
import { transformClassToStyleProps } from '../style-syntax'
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
  color?: LiteralUnion<ForegroundColorName, string>
  bgColor?: LiteralUnion<ForegroundColorName, string>
  dimmed?: boolean
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  inverse?: boolean
  wrap?: Styles['textWrap']
}

function transform(props: TuiTextProps, text: string): string {
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

export const TuiText = defineComponent({
  name: 'TuiText',

  props: {
    color: String as PropType<LiteralUnion<ForegroundColorName, string>>,
    bgColor: String as PropType<LiteralUnion<ForegroundColorName, string>>,
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

    return () => {
      const propsWithClassesValue = propsWithClasses.value
      return h(
        'tui:text',
        {
          style: { ...defaultStyle, textWrap: propsWithClassesValue.wrap },
          internal_transform: (text: string) =>
            transform(propsWithClassesValue, text),
        },
        slots.default?.()
      )
    }
  },
})
