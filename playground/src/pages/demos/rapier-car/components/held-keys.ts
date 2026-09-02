// Driving needs held keys, which a TTY only really reports through the Kitty
// keyboard protocol's event types (`useKittyKeyboard: { events: true }` in
// main.ts). Where those releases arrive, they are the truth. Where they don't
// — tmux, ssh, terminals without the protocol — a held key still shows up as
// the terminal's own auto-repeat, so a key goes stale once no press/repeat has
// arrived for a while. The two are never mixed: the first release switches the
// tracker over for good, otherwise the timeout would drop keys during the
// ~500ms gap before auto-repeat kicks in.
import { onFrame } from '@vue-termui/three'
import { onKeyDown, onKeyUp, reactive } from 'vue-termui'

const STALE_AFTER = 600

/**
 * Reactive set of the currently held key names, restricted to `watched` so
 * unrelated keys never linger in it.
 */
export function useHeldKeys(watched: readonly string[]): ReadonlySet<string> {
  const names = new Set(watched)
  const held = reactive(new Set<string>())
  const lastSeen = new Map<string, number>()
  let releasesWork = false

  onKeyDown((key) => {
    if (!names.has(key.name)) return
    held.add(key.name)
    lastSeen.set(key.name, performance.now())
  })

  onKeyUp((key) => {
    releasesWork = true
    held.delete(key.name)
    lastSeen.delete(key.name)
  })

  onFrame(() => {
    if (releasesWork || !held.size) return
    const now = performance.now()
    // copy: dropping a key mutates the set being walked
    for (const name of [...held]) {
      if (now - (lastSeen.get(name) ?? 0) < STALE_AFTER) continue
      held.delete(name)
      lastSeen.delete(name)
    }
  })

  return held
}
