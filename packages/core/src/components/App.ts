import {
  h,
  provide,
  defineComponent,
  onMounted,
  onUnmounted,
  onUpdated,
  onErrorCaptured,
  inject,
  DefineComponent,
  PropType,
} from '@vue/runtime-core'
import ansiEscapes from 'ansi-escapes'
import { renderRoot } from '../renderer/render'
import {
  renderOnceSymbol,
  scheduleUpdateSymbol,
  useLog,
  useRootNode,
} from '../injectionSymbols'
import { stdoutSymbol } from '../composables/writeStreams'
import { onResize } from '../composables/screen'
// TODO: useSettings()

export const TuiApp = defineComponent({
  name: 'TuiRoot',
  props: {
    root: {
      type: Object as PropType<DefineComponent>,
      required: true,
    },

    // TODO: remove and useStdout() ?
    stdout: {
      type: Object as PropType<NodeJS.WriteStream>,
      required: true,
    },
    swapScreens: Boolean,
  },
  setup(props, { attrs }) {
    const log = useLog()

    const { stdout } = props

    const writeToStdout: NodeJS.WriteStream['write'] = (...args) => {
      log.clear()
      // @ts-expect-error: args fails for some reason
      const ret = stdout.write.apply(stdout, args)
      log(lastOutput)
      return ret
    }

    provide(stdoutSymbol, { stdout, write: writeToStdout })

    const rootNode = useRootNode()

    let lastOutput: string = ''

    function renderTuiApp() {
      // console.log('need update', i?.root.vnode.el)
      const { output, outputHeight, staticOutput } = renderRoot(
        rootNode,
        stdout.columns || 80
      )

      // If <Static> output isn't empty, it means new children have been added to it
      const hasStaticOutput = staticOutput && staticOutput !== '\n'

      // console.log('update', { hasStaticOutput })

      if (outputHeight >= stdout.rows || props.swapScreens) {
        stdout.write(
          ansiEscapes.cursorTo(0, 0) +
            ansiEscapes.eraseDown +
            /* fullStaticOutput + */ output
        )

        lastOutput = output

        return
      }

      if (!hasStaticOutput && output !== lastOutput) {
        log(output)
      }

      lastOutput = output
    }

    let interval: NodeJS.Timer
    let needsUpdate = false
    const renderOnce = inject(renderOnceSymbol, false)
    onMounted(() => {
      if (!renderOnce) {
        interval = setInterval(() => {
          if (needsUpdate) {
            renderTuiApp()
            needsUpdate = false
          }
        }, 32)
        stdout.on('resize', scheduleUpdate)
      }
      renderTuiApp()
    })

    onUnmounted(() => {
      clearInterval(interval)
      stdout.off('resize', scheduleUpdate)
    })

    function scheduleUpdate() {
      needsUpdate = true
    }
    provide(scheduleUpdateSymbol, scheduleUpdate)

    onUpdated(scheduleUpdate)

    onErrorCaptured((error, target) => {
      debugger
      console.error('Captured Error')
      console.error(error)
      console.log(target)
    })

    return () => h(props.root, attrs)
  },
})
