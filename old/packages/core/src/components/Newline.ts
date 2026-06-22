import { h, FunctionalComponent } from '@vue/runtime-core'

export const TuiNewline: FunctionalComponent<{ n?: number }> = (props) =>
  h('tui:text', '\n'.repeat(props.n ?? 1))

TuiNewline.displayName = 'TuiNewline'
