import { onScopeDispose } from '@vue/runtime-core'
import type { CliRenderEvents, CliRenderer } from '@opentui/core'
import { useRenderer } from '../renderer/index'
import type { RemoveListener } from '../utils/types'

type Listener = (...args: unknown[]) => void

/**
 * Per-renderer, per-event fan-out. `CliRenderer` extends Node's `EventEmitter`,
 * which warns once more than 10 listeners are attached to the same event. Since
 * composables subscribe one listener per component, an app with 11+ of them
 * would trip that warning. To avoid it we keep a single underlying
 * `renderer.on()` per event and fan out to the local set of subscribers
 * ourselves.
 */
const registries = new WeakMap<
  CliRenderer,
  Map<CliRenderEvents, { fanOut: Listener; subscribers: Set<Listener> }>
>()

function getRendererEventRegistry(
  renderer: CliRenderer,
): Map<CliRenderEvents, { fanOut: Listener; subscribers: Set<Listener> }> {
  let events = registries.get(renderer)
  if (!events) {
    events = new Map()
    registries.set(renderer, events)
  }
  return events
}

function getRendererEventEntry(
  renderer: CliRenderer,
  event: CliRenderEvents,
): { fanOut: Listener; subscribers: Set<Listener> } {
  const events = getRendererEventRegistry(renderer)
  let entry = events.get(event)
  if (!entry) {
    const subscribers = new Set<Listener>()
    // Copy before iterating so a listener that unsubscribes during dispatch
    // doesn't mutate the set mid-loop.
    const fanOut: Listener = (...args) => {
      for (const sub of [...subscribers]) sub(...args)
    }
    entry = { fanOut, subscribers }
    events.set(event, entry)
    renderer.on(event, fanOut)
  }
  return entry
}

/**
 * Subscribes `listener` to a renderer event. Returns a function that removes it.
 * Deduplicates multiple subscriptions to the same event on the same renderer
 *
 * @param renderer The renderer to listen on
 * @param event The event to listen for
 * @param listener The callback to invoke when the event fires
 *
 * @internal
 */
export function subscribeRendererEvent(
  renderer: CliRenderer,
  event: CliRenderEvents,
  listener: () => void,
): RemoveListener {
  const events = getRendererEventRegistry(renderer)
  const entry = getRendererEventEntry(renderer, event)
  entry.subscribers.add(listener)

  let removed = false
  return () => {
    if (removed) return
    removed = true
    entry!.subscribers.delete(listener)
    // Last subscriber gone: detach the single underlying listener too.
    if (entry!.subscribers.size === 0) {
      renderer.off(event, entry!.fanOut)
      events!.delete(event)
      if (events!.size === 0) registries.delete(renderer)
    }
  }
}

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
  const remove = subscribeRendererEvent(renderer, event, listener)
  onScopeDispose(remove, true)

  return remove
}
