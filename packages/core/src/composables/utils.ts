import { onMounted, onUnmounted, ref } from '@vue/runtime-core'

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
