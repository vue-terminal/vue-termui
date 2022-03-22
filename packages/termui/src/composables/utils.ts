import { onMounted, onUnmounted, ref } from '@vue/runtime-core'
import { useStdout } from './writeStreams'

export function useInterval(fn: () => void, interval?: number) {
  let handle: ReturnType<typeof setInterval>
  onMounted(() => {
    handle = setInterval(fn, interval)
  })
  onUnmounted(() => {
    clearInterval(handle)
  })
}

export function useTimeout(fn: () => void, delay?: number) {
  let handle: ReturnType<typeof setTimeout>
  onMounted(() => {
    handle = setTimeout(fn, delay)
  })
  onUnmounted(() => {
    clearTimeout(handle)
  })
}

function useTimeFunction<RT = any>(
  fn: (cb: () => void, time?: number) => RT,
  clear: (id?: RT) => void
) {
  return (cb: () => void, time?: number) => {
    let handle: RT
    onMounted(() => {
      handle = fn(cb, time)
    })
    onUnmounted(() => {
      clear(handle)
    })
  }
}

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
