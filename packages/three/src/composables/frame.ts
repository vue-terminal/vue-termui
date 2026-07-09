import { onScopeDispose, useRenderer } from 'vue-termui'

/**
 * Runs `callback` on every rendered frame with the elapsed milliseconds since
 * the previous frame. Use it to advance animations (uniforms, object
 * transforms) before the scene draws. Removed automatically when the current
 * effect scope stops (e.g. component unmount).
 *
 * @param callback - invoked once per frame with the frame delta in ms
 * @returns a function that removes the listener early
 *
 * @example
 * ```ts
 * const time = uniform(0)
 * onFrame((deltaMs) => {
 *   time.value += deltaMs / 1000
 * })
 * ```
 */
export function onFrame(callback: (deltaMs: number) => void | Promise<void>): () => void {
  const renderer = useRenderer()
  const frameCallback = async (deltaMs: number): Promise<void> => {
    await callback(deltaMs)
  }
  renderer.setFrameCallback(frameCallback)

  let removed = false
  const remove = (): void => {
    if (removed) return
    removed = true
    renderer.removeFrameCallback(frameCallback)
  }
  onScopeDispose(remove)
  return remove
}
