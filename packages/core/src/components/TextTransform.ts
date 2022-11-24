import chalk, { ForegroundColor } from 'chalk'
import { h, inject, FunctionalComponent } from '@vue/runtime-core'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import type { OutputTransformer } from '../renderer/Output'
import { defaultStyle, TuiTextProps } from './Text'
import { colorize } from '../renderer/textColor'
import { propsCamelize } from '../utils'

/**
 * A Text Transforms allows modifying the text before it is written to the stdout while accounting for line breaks and
 * text wrapping.
 */
export const TuiTextTransform: FunctionalComponent<
  {
    transform?: OutputTransformer
  } & TuiTextProps
> = (props, { slots }) => {
  props = propsCamelize(props)
  const scheduleUpdate = inject(scheduleUpdateSymbol)!
  scheduleUpdate()
  // onUpdated(() => {
  //   scheduleUpdate()
  // })

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
  return h(
    'tui:text',
    {
      style: { ...defaultStyle, textWrap: props.wrap },
      internal_transform: props.transform
        ? (text: string) => transform(props.transform!(text))
        : transform,
    },
    slots.default?.()
  )
}

TuiTextTransform.displayName = 'TuiTextTransform'
