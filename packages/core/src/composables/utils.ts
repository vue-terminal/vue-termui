import { onMounted, onUnmounted } from '@vue/runtime-core'

export function useInterval(fn: () => void, interval?: number) {
  let handle: ReturnType<typeof setInterval>

  function restart() {
    stop()
    handle = setInterval(fn, interval)
  }
  function stop() {
    clearInterval(handle)
  }

  onMounted(restart)
  onUnmounted(stop)

  return { restart, stop }
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
