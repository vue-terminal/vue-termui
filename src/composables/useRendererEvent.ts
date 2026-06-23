import { onScopeDispose } from '@vue/runtime-core'
import type { CliRenderEvents } from '@opentui/core'
import { useRenderer } from '../renderer/index'
import type { RemoveListener } from './keyboard'

/**
 * Subscribes `listener` to a renderer event for the lifetime of the current
 * effect scope. The listener is removed automatically when the owning
 * component unmounts; the returned function removes it early.
 *
 * `event` is constrained to {@link CliRenderEvents}, so listening on an unknown
 * event is a type error. The renderer does not type its event payloads, so
 * handlers read the live state off the renderer (e.g. `renderer.width`) rather
 * than from arguments — hence the `() => void` listener.
 */
export function useRendererEvent(event: CliRenderEvents, listener: () => void): RemoveListener {
  const renderer = useRenderer()
  renderer.on(event, listener)
  const remove: RemoveListener = () => renderer.off(event, listener)
  onScopeDispose(remove, true)
  return remove
}
