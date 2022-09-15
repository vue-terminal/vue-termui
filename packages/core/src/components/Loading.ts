import {
  computed,
  defineComponent,
  h,
  inject,
  onMounted,
  onUnmounted,
  onUpdated,
  ref,
} from '@vue/runtime-core'
import spinners from 'cli-spinners'
import type { PropType } from '@vue/runtime-core'
import { scheduleUpdateSymbol } from '../injectionSymbols'
import type { SpinnerName } from 'cli-spinners'

export const TuiLoading = defineComponent({
  props: {
    /**
     * Type of a loading.
     * See [cli-spinners](https://github.com/sindresorhus/cli-spinners) for available spinners.
     *
     * @default dots
     */
    type: String as PropType<SpinnerName>,
  },
  setup(props) {
    const spinner = computed(() => spinners[props.type ?? 'dots'])
    const frame = ref(0)
    let timer: NodeJS.Timer | null = null
    const scheduleUpdate = inject(scheduleUpdateSymbol)!
    onUpdated(scheduleUpdate)
    onMounted(() => {
      timer = setInterval(() => {
        frame.value = (frame.value + 1) % spinner.value?.frames?.length
      }, spinner.value.interval)
    })
    onUnmounted(() => {
      clearInterval(timer!)
    })

    return () => {
      return h('tui:text', spinner.value?.frames[frame.value])
    }
  },
})
