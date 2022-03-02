import { h, provide } from '@vue/runtime-core'
import ansiEscapes from 'ansi-escapes'
import { renderRoot } from '../render'
import {
  scheduleUpdateSymbol,
  useLog,
  useRootNode,
  useStdout,
} from '../injectionSymbols'
// TODO: useSettings()

export const TuiApp = defineComponent({
  name: 'TuiApp',
  props: {
    root: {
      type: Object,
      required: true,
    },
  },
  setup(props, { attrs }) {
    const log = useLog()

    const rootNode = useRootNode()
    const stdout = useStdout()

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

      if (outputHeight >= stdout.rows) {
        stdout.write(
          ansiEscapes.clearTerminal + /* fullStaticOutput + */ output
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

    onMounted(() => {
      interval = setInterval(() => {
        if (needsUpdate) {
          renderTuiApp()
          needsUpdate = false
        }
      }, 32)
      renderTuiApp()
    })

    onUnmounted(() => {
      clearInterval(interval)
    })

    function scheduleUpdate() {
      needsUpdate = true
    }
    provide(scheduleUpdateSymbol, scheduleUpdate)

    onUpdated(() => {
      scheduleUpdate()
    })

    onErrorCaptured((error, target) => {
      console.error(error)
      console.log(target)
    })

    // TODO: could return a Box
    return () => h(props.root, attrs)
  },
})
