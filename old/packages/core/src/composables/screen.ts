import { onMounted, onUnmounted, ref, watch } from '@vue/runtime-core'
import { MaybeRef } from '~/utils'
import { useStdout } from './writeStreams'

/**
 * Listen to resize events on the terminal. Automatically removes the event handler when unmounting.
 *
 * @param handler - callback
 * @returns a function to remove the listener
 */
export function onResize(handler: () => void) {
  const { stdout } = useStdout()

  onMounted(() => {
    stdout.on('resize', handler)
  })
  function remove() {
    stdout.off('resize', handler)
  }

  onUnmounted(remove)

  return remove
}

export function useStdoutDimensions() {
  const { stdout } = useStdout()
  const width = ref(stdout.columns)
  const height = ref(stdout.rows)

  onResize(() => {
    width.value = stdout.columns
    height.value = stdout.rows
  })

  return [width, height]
}

export function useTitle(initialTitle: MaybeRef<string> = '') {
  const { stdout } = useStdout()
  const title = ref(initialTitle)

  function changeTitle(text: string) {
    setTitle(stdout, text)
  }

  watch(title, changeTitle, { immediate: !!title.value })

  onUnmounted(() => {
    // resets the title on exit
    changeTitle('')
  })
}

function setTitle(stdout: NodeJS.WriteStream, title: string) {
  stdout.write(`\x1b]0;${title}\x07`)
}
