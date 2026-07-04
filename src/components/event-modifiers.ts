// Event listener modifiers.
//
// Vue's `v-on` modifiers (`@keyDown.ctrl.c`, `@mouseDown.stop`) are compiled by
// `@vue/compiler-dom` into `withKeys`/`withModifiers` guards that only understand
// DOM events — they read `event.key`/`event.ctrlKey`/`event.currentTarget`, none
// of which exist on OpenTUI's `KeyEvent`/`MouseEvent`. So we take modifier
// handling into our own hands: the vue-termui SFC transform (see `../vite`) leaves
// the handler unwrapped and instead encodes the modifiers into the listener prop
// name (`@keyDown.ctrl.c` → `onKeyDown__ctrl__c`). {@link resolveEventListeners}
// then parses them back out and wraps the handler with guards that read the
// terminal event shapes. Mirrors `shentao/vue-global-events`, but for the TUI.
//
// Both `@opentui/core` and `../composables/keyboard` are imported *for types
// only*, so this module carries no runtime dependency on them. That lets the
// build-time SFC transform in `../vite` import {@link EVENT_MODIFIER_SEPARATOR}
// from here without pulling the native `@opentui/core` FFI into the Vite process.
import type { MouseEvent as TuiMouseEvent } from '@opentui/core'
import type { KeyEvent } from '../composables/keyboard'

/**
 * Separator the SFC transform uses to encode `v-on` modifiers into a renderable
 * listener prop name (`@keyDown.ctrl.c` → `onKeyDown__ctrl__c`), and that
 * {@link resolveEventListeners} parses back out. Chosen so it never collides with
 * the camelCase TUI event names it is appended to.
 *
 * @internal
 */
export const EVENT_MODIFIER_SEPARATOR = '__'

/** A listener prop is `on` followed by an uppercase letter, per Vue convention. */
const LISTENER_RE = /^on[A-Z]/

/** Modifiers that manage event flow rather than filtering it. */
const FLOW_MODIFIERS: ReadonlySet<string> = new Set(['stop', 'prevent'])

/**
 * Modifiers accepted for parity with Vue but with no terminal equivalent, so
 * they are ignored rather than mistaken for a key name. `self` would need the
 * receiving renderable to compare against `event.target`, which the resolver has
 * no handle on; `capture`/`passive`/`once` are DOM `addEventListener` options
 * that a single renderable setter has no notion of.
 */
const IGNORED_MODIFIERS: ReadonlySet<string> = new Set(['self', 'capture', 'passive', 'once'])

/** Canonical chord modifiers, shared by key and mouse events. */
type SystemModifier = 'ctrl' | 'shift' | 'alt' | 'meta'

/**
 * Chord-modifier tokens, normalized to a canonical {@link SystemModifier}.
 * `option` is Alt on key events; `cmd`/`command` are Meta aliases.
 */
const SYSTEM_MODIFIER_ALIASES: Record<string, SystemModifier> = {
  ctrl: 'ctrl',
  control: 'ctrl',
  shift: 'shift',
  alt: 'alt',
  option: 'alt',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
}

/** All system dimensions, per event kind, used to evaluate `.exact`. */
const KEY_SYSTEM_DIMENSIONS: readonly SystemModifier[] = ['ctrl', 'shift', 'alt', 'meta']
const MOUSE_SYSTEM_DIMENSIONS: readonly SystemModifier[] = ['ctrl', 'shift', 'alt']

/** Mouse button tokens → OpenTUI's `MouseButton` numeric codes. */
const MOUSE_BUTTONS: Record<string, number> = { left: 0, middle: 1, right: 2 }

/**
 * Key-name modifier aliases → the names OpenTUI actually reports. OpenTUI
 * normalizes Enter to `return`, Esc to `escape`, and Space to a literal `" "`.
 * Unlisted tokens fall back to a case-insensitive match against `key.name`, so
 * single letters (`.a`), digits, and arrow keys (`.up`) need no entry.
 */
const KEY_NAME_ALIASES: Record<string, readonly string[]> = {
  enter: ['return', 'enter'],
  return: ['return', 'enter'],
  esc: ['escape', 'esc'],
  escape: ['escape', 'esc'],
  space: ['space', ' '],
  spacebar: ['space', ' '],
  del: ['delete'],
  delete: ['delete'],
}

/** A single renderable event listener (`KeyEvent` or `MouseEvent` handler). */
type EventListener = (event: KeyEvent | TuiMouseEvent) => void

/** A parsed listener: its handlers and the modifiers guarding them. */
interface ListenerGroup {
  handlers: EventListener[]
  modifiers: string[]
}

function isMouseEvent(event: KeyEvent | TuiMouseEvent): event is TuiMouseEvent {
  return 'modifiers' in event
}

/** Whether the given system modifier is currently held on the event. */
function isSystemModifierHeld(event: KeyEvent | TuiMouseEvent, mod: SystemModifier): boolean {
  if (isMouseEvent(event)) {
    // Mouse events carry only ctrl/shift/alt (no meta).
    return mod === 'meta' ? false : event.modifiers[mod]
  }
  switch (mod) {
    case 'ctrl':
      return event.ctrl
    case 'shift':
      return event.shift
    case 'alt':
      return event.option
    case 'meta':
      return event.meta
  }
}

/** Whether `key.name` satisfies a key-name modifier token (case-insensitive). */
function keyNameMatches(name: string, token: string): boolean {
  const n = name.toLowerCase()
  const t = token.toLowerCase()
  if (n === t) return true
  return (KEY_NAME_ALIASES[t] ?? []).includes(n)
}

/**
 * Whether `event` satisfies every filtering modifier in `modifiers`. Flow
 * modifiers (`stop`/`prevent`) are not filters and are ignored here — they are
 * applied separately by {@link applyFlowModifiers} once the guard passes.
 */
function eventPassesModifiers(event: KeyEvent | TuiMouseEvent, modifiers: string[]): boolean {
  const mouse = isMouseEvent(event)
  const required: SystemModifier[] = []
  const filters: string[] = []
  let exact = false

  for (const modifier of modifiers) {
    if (FLOW_MODIFIERS.has(modifier) || IGNORED_MODIFIERS.has(modifier)) continue
    if (modifier === 'exact') {
      exact = true
      continue
    }
    const system = SYSTEM_MODIFIER_ALIASES[modifier]
    if (system) {
      required.push(system)
    } else {
      filters.push(modifier)
    }
  }

  for (const modifier of required) {
    if (!isSystemModifierHeld(event, modifier)) return false
  }

  if (exact) {
    const wanted = new Set(required)
    const dimensions = mouse ? MOUSE_SYSTEM_DIMENSIONS : KEY_SYSTEM_DIMENSIONS
    for (const dimension of dimensions) {
      if (isSystemModifierHeld(event, dimension) !== wanted.has(dimension)) return false
    }
  }

  if (filters.length) {
    if (mouse) {
      if (!filters.some((token) => MOUSE_BUTTONS[token] === event.button)) return false
    } else {
      if (!filters.some((token) => keyNameMatches(event.name, token))) return false
    }
  }

  return true
}

/** Apply `.stop`/`.prevent` once a guard has passed. */
function applyFlowModifiers(event: KeyEvent | TuiMouseEvent, modifiers: string[]): void {
  if (modifiers.includes('stop')) event.stopPropagation()
  if (modifiers.includes('prevent')) event.preventDefault()
}

/** Coerce an attr value into a flat list of listener functions. */
function toListeners(value: unknown): EventListener[] {
  const values = Array.isArray(value) ? value : [value]
  return values.filter((entry): entry is EventListener => typeof entry === 'function')
}

/**
 * Rewrite an attrs object so modifier-encoded event listeners
 * (`onKeyDown__ctrl__c`, produced by the vue-termui SFC transform) become plain
 * renderable listeners (`onKeyDown`) that apply their modifiers against the
 * terminal event. Listeners for the same base event — including a plain,
 * unmodified one — are merged into a single dispatcher, since a renderable holds
 * only one handler per event.
 *
 * Non-listener attrs and unmodified listeners are passed through untouched; when
 * nothing is encoded the original object is returned as-is (no allocation).
 *
 * @param attrs - the component's `attrs` (or any prop bag) to normalize
 * @internal
 */
export function resolveEventListeners(attrs: Record<string, unknown>): Record<string, unknown> {
  let hasEncoded = false
  for (const key in attrs) {
    if (LISTENER_RE.test(key) && key.includes(EVENT_MODIFIER_SEPARATOR)) {
      hasEncoded = true
      break
    }
  }
  if (!hasEncoded) return attrs

  const result: Record<string, unknown> = {}
  const groups = new Map<string, ListenerGroup[]>()

  for (const key in attrs) {
    const value = attrs[key]
    const separator = LISTENER_RE.test(key) ? key.indexOf(EVENT_MODIFIER_SEPARATOR) : -1
    if (separator === -1) {
      result[key] = value
      continue
    }
    const base = key.slice(0, separator)
    const modifiers = key
      .slice(separator + EVENT_MODIFIER_SEPARATOR.length)
      .split(EVENT_MODIFIER_SEPARATOR)
    const group = groups.get(base)
    const entry: ListenerGroup = { handlers: toListeners(value), modifiers }
    if (group) group.push(entry)
    else groups.set(base, [entry])
  }

  for (const [base, entries] of groups) {
    // A plain `@keyDown="fn"` on the same event lands in `result` above; fold it
    // in as an always-run listener so both fire.
    const plain = toListeners(result[base])
    result[base] = (event: KeyEvent | TuiMouseEvent): void => {
      for (const handler of plain) handler(event)
      for (const { handlers, modifiers } of entries) {
        if (!eventPassesModifiers(event, modifiers)) continue
        applyFlowModifiers(event, modifiers)
        for (const handler of handlers) handler(event)
      }
    }
  }

  return result
}
