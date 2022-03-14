import { defineComponent, FunctionalComponent, h } from '@vue/runtime-core'
import { TuiTextTransform } from './TextTransform'
import terminalLink from 'terminal-link'
import { TuiText } from './Text'

export const TuiLink: FunctionalComponent<{
  href: string
  fallback?: boolean
}> = (props, { slots }) => {
  return h(
    TuiTextTransform,
    {
      transform: (text) =>
        terminalLink(text, props.href, { fallback: props.fallback ?? true }),
    },
    { default: slots.default }
  )
}

TuiLink.displayName = 'TuiLink'
