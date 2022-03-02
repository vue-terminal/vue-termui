import { h } from '@vue/runtime-core'

export const TuiNewline = defineComponent({
  name: 'TuiNewline',
  props: {
    n: Number,
  },
  setup(props) {
    return () => h('tui-text', '\n'.repeat(props.n || 1))
  },
})
