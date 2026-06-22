import { getCurrentScope, onScopeDispose } from '@vue/runtime-core'

/**
 * Runs `fn` every `ms` milliseconds, starting immediately. The interval is
 * cleared automatically when the owning component (effect scope) is torn down;
 * the returned function stops it early.
 *
 * @example
 * ```ts
 * const seconds = ref(0)
 * useInterval(() => seconds.value++, 1000)
 * ```
 */
export function useInterval(fn: () => void, ms: number): () => void {
  const handle = setInterval(fn, ms)
  const stop = (): void => clearInterval(handle)
  if (getCurrentScope()) {
    onScopeDispose(stop)
  }
  return stop
}

/**
 * Runs `fn` once after `ms` milliseconds. The timeout is cleared automatically
 * when the owning component (effect scope) is torn down before it fires; the
 * returned function cancels it early.
 */
export function useTimeout(fn: () => void, ms: number): () => void {
  const handle = setTimeout(fn, ms)
  const stop = (): void => clearTimeout(handle)
  if (getCurrentScope()) {
    onScopeDispose(stop)
  }
  return stop
}
