import chalk, { ForegroundColor } from 'chalk'
import {
  PropType,
  h,
  inject,
  defineComponent,
  onUpdated,
  FunctionalComponent,
} from '@vue/runtime-core'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import { OutputTransformer } from '../Output'
import { defaultStyle } from './Text'

/**
 * A Text Transforms allows modifying the text before it is written to the stdout while accounting for line breaks and
 * text wrapping.
 */
export const TuiTextTransform: FunctionalComponent<{
  transform?: OutputTransformer
}> = (props, { slots }) => {
  const scheduleUpdate = inject(scheduleUpdateSymbol)!
  scheduleUpdate()
  // onUpdated(() => {
  //   scheduleUpdate()
  // })
  return h(
    'tui-text',
    {
      style: defaultStyle,
      internal_transform: props.transform,
    },
    slots.default?.()
  )
}

TuiTextTransform.displayName = 'TuiTextTransform'
