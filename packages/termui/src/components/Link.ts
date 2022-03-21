import { defineComponent, FunctionalComponent, h } from '@vue/runtime-core'
import { TuiTextTransform } from './TextTransform'
import terminalLink from 'terminal-link'
import { TuiText } from './Text'
import { useFocus } from '../focus/Focusable'

// export const TuiLink: FunctionalComponent<{
//   href: string
//   fallback?: boolean
// }> = (props, { slots }) => {
//   return h(
//     TuiTextTransform,
//     {
//       transform: (text) =>
//         terminalLink(text, props.href, { fallback: props.fallback ?? true }),
//     },
//     { default: slots.default }
//   )
// }
// TuiLink.displayName = 'TuiLink'

export const TuiLink = defineComponent({
  props: {
    href: {
      type: String,
      required: true,
    },
    fallback: Boolean,
    disabled: Boolean,
  },
  setup(props, { slots }) {
    const { active } = useFocus({ active: true })

    return () =>
      h(
        // @ts-expect-error: doesn't like disabled prop
        TuiTextTransform,
        {
          inverse: active.value,
          dimmed: props.disabled,
          ...props,
          transform: (text) =>
            props.disabled
              ? (v: string) => v
              : terminalLink(text, props.href, {
                  fallback: props.fallback ?? true,
                }),
        },
        { default: slots.default }
      )
  },
})
