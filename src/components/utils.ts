import {
  type BaseRenderable,
  type MouseEvent as TuiMouseEvent,
  type Renderable,
  type RenderContext,
  RenderableEvents,
} from '@opentui/core'
import type { KeyEvent } from '../composables/keyboard'
import type {
  Component,
  ComponentOptionsMixin,
  ComponentProvideOptions,
  ComputedOptions,
  DefineComponent,
  Directive,
  ExtractDefaultPropTypes,
  MethodOptions,
  PublicProps,
} from '@vue/runtime-core'

/**
 * A {@link DefineComponent} whose instances expose a concrete OpenTUI
 * renderable as `$el`, typed instead of `any`.
 *
 * Vue's public `$el` type comes from `DefineComponent`'s trailing `TypeEl`
 * generic, but that slot is constrained to the DOM `Element` interface and
 * OpenTUI renderables are `EventEmitter`s, not DOM nodes. We satisfy the
 * constraint with `El & Element`: every renderable member (`.value`,
 * `.focus()`, `.on()`, …) still resolves and the value stays assignable to a
 * plain `El`, while the inert DOM members are never used at runtime. All other
 * generics are pinned to `DefineComponent`'s own defaults so the result is a
 * genuine `DefineComponent` — template/JSX prop typing, emits and refs are
 * unaffected.
 *
 * @typeParam Props - the component's props (also used for template/JSX typing)
 * @typeParam El - the OpenTUI renderable backing this component (`$el`)
 *
 * @example
 * ```ts
 * export const Input: TuiComponent<InputProps, InputRenderable> = defineComponent({ … })
 * ```
 */
export type TuiComponent<Props, El extends BaseRenderable> = DefineComponent<
  Props, // PropsOrPropOptions
  {}, // RawBindings
  {}, // D
  ComputedOptions, // C
  MethodOptions, // M
  ComponentOptionsMixin, // Mixin
  ComponentOptionsMixin, // Extends
  {}, // E
  string, // EE
  PublicProps, // PP
  Readonly<Props>, // Props (= ResolveProps<Props, {}>)
  ExtractDefaultPropTypes<Props>, // Defaults
  {}, // S
  Record<string, Component>, // LC
  Record<string, Directive>, // Directives
  string, // Exposed
  ComponentProvideOptions, // Provide
  true, // MakeDefaultsOptional
  {}, // TypeRefs
  El & Element // TypeEl — see note above
>

/**
 * Converts a prop to an optional boolean value. Allows passing down undefined to preserver defaults
 * while considering empty strings like a true value.
 *
 * @internal
 */
export function propToOptionalBoolean(prop: unknown): boolean | undefined {
  return prop == null ? undefined : !(prop === false)
}

/**
 * Extract only the keys of `T` whose values are optional booleans. Used by
 {@link optionalBooleanProps} to ensure we only pick the right props off a
 component's props object.
 *
 * @internal
 */
export type OptionalBooleanKeys<T> = {
  [K in keyof T]-?: boolean extends T[K] ? K : never
}[keyof T]

/**
 * Pick the given optional-boolean props off `source`, coerce them with
 * {@link propToOptionalBoolean}, and return an object containing *only* the
 * keys the author actually set.
 *
 * OpenTUI's boolean setters (`focusable`, `showDescription`, …) are plain
 * assignments with no `undefined` guard, so spreading an unset prop as
 * `key: undefined` resets a renderable whose default is `true` (e.g.
 * `focusable` on `Input`/`Select`) down to `undefined`. Omitting the key
 * instead preserves each renderable's own default; an explicit `false` still
 * opts out and an empty-string attribute (`<Input focusable />`) reads as
 * `true`.
 *
 * @internal
 */
export function optionalBooleanProps<T extends object, K extends OptionalBooleanKeys<T>>(
  source: T,
  keys: readonly K[],
): { [P in K]?: boolean } {
  const result: { [P in K]?: boolean } = {}
  for (const key of keys) {
    const value = propToOptionalBoolean(source[key])
    if (value !== undefined) result[key] = value
  }
  return result
}

/**
 * Wrap a single computed value as a spreadable prop object that *omits* the key
 * entirely when the value is `undefined`. Spreading `{ key: undefined }` into a
 * renderable still calls its setter with `undefined` (OpenTUI setters have no
 * guard), overwriting the renderable's own default; omitting the key preserves
 * it. The single-value counterpart to {@link optionalBooleanProps}, for computed
 * values that don't map 1:1 to a prop (e.g. a focus-derived `borderColor`).
 *
 * @internal
 */
export function optionalProp<K extends string, V>(key: K, value: V | undefined): { [P in K]?: V } {
  return (value === undefined ? {} : { [key]: value }) as { [P in K]?: V }
}

/**
 * Type helper to ensure we declare all needed events in `emits`
 *
 * @internal
 */
export type ExtractEventsNames<Props, BaseProps> = {
  [K in Exclude<keyof Props, keyof BaseProps> as K extends `on${infer E}`
    ? Uncapitalize<E>
    : never]: unknown
}

/**
 * Global props shared by every renderable element
 */
export interface RenderableEventProps {
  /**
   * Emitted when the element gains focus.
   */
  onFocus?: () => void

  /**
   * Emitted when the element loses focus.
   */
  onBlur?: () => void

  /**
   * Emitted when the element is destroyed.
   */
  onDestroyed?: () => void

  /**
   * Focus the element on mount, like HTML's `autofocus`. Ignored by
   * non-focusable elements. When several are set, the first one wins.
   */
  autofocus?: boolean

  /**
   * Whether the element can receive focus (via keyboard, mouse or `focus()`).
   * Each renderable has its own default — interactive ones (`Input`, `Textarea`,
   * `Select`) are focusable, containers (`Box`) are not — so leaving this unset
   * keeps that default. Set it to opt a container in or an interactive element
   * out.
   */
  focusable?: boolean
}

/**
 * Global props for all renderable components to spread into their `props` option.
 *
 * @internal
 */
export const renderableProps = {
  autofocus: Boolean as BooleanConstructor, // cast needed with --isolatedDeclarations
  focusable: null,
}

/**
 * Just a pass-through validator for the `emits` option
 *
 * @internal
 */
const EMIT_VALIDATOR = () => true

/**
 * Runtime `emits` validators for the {@link RenderableEventProps} lifecycle events.
 * Spread into a component's `emits` option alongside its own events.
 *
 * @internal
 */
export const renderableEmits: Record<
  keyof ExtractEventsNames<RenderableEventProps, {}>,
  () => boolean
> = {
  focus: EMIT_VALIDATOR,
  blur: EMIT_VALIDATOR,
  destroyed: EMIT_VALIDATOR,
}

/**
 * @internal
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never

/**
 * To type the argument of {@link setupRenderableEvents}
 *
 * @internal
 */
type EmitFn<Events extends string> = UnionToIntersection<
  Events extends any ? (event: Events) => void : never
>

/**
 * Attach RenderableEvents listeners to a component's `emit` function. Should
 * be called within the `setup()` or `onMounted()` lifecycle hooks of a
 * component that wraps a renderable element.
 *
 * @param el - the mounted renderable
 * @param emit - the component's `emit` function
 * @param options - `autofocus` focuses the element on mount
 * @internal
 */
export function setupRenderableEvents(
  el: Renderable,
  emit: EmitFn<keyof ExtractEventsNames<RenderableEventProps, {}>>,
  { autofocus }: RenderableEventProps = {},
): void {
  // NOTE: it could be worth to not add event listeners if the corresponding emit is not defined but then it wouldn't be reactive
  el.on(RenderableEvents.FOCUSED, () => emit('focus'))
  el.on(RenderableEvents.BLURRED, () => emit('blur'))
  el.on(RenderableEvents.DESTROYED, () => emit('destroyed'))
  if (autofocus) queueAutofocus(el)
}

// Pending autofocus candidates per app. Like HTML's autofocus, elements
// register on mount and, one microtask later, the first focusable one wins —
// so mounting several together is first-wins, not last.
const autofocusCandidates = new WeakMap<RenderContext, Renderable[]>()

function queueAutofocus(el: Renderable): void {
  const ctx = el.ctx
  const pending = autofocusCandidates.get(ctx)
  if (pending) {
    pending.push(el)
    return
  }
  const candidates = [el]
  autofocusCandidates.set(ctx, candidates)
  queueMicrotask(() => {
    autofocusCandidates.delete(ctx)
    candidates.find((candidate) => !candidate.isDestroyed && candidate.focusable)?.focus()
  })
}

// -----------------------------------------------------------------------------
// Event listener modifiers
// -----------------------------------------------------------------------------
//
// Vue's `v-on` modifiers (`@keyDown.ctrl.c`, `@mouseDown.stop`) are compiled by
// `@vue/compiler-dom` into `withKeys`/`withModifiers` guards that only understand
// DOM events — they read `event.key`/`event.ctrlKey`/`event.currentTarget`, none
// of which exist on OpenTUI's `KeyEvent`/`MouseEvent`. So we take modifier
// handling into our own hands: the vue-termui SFC transform (see `./vite`) leaves
// the handler unwrapped and instead encodes the modifiers into the listener prop
// name (`@keyDown.ctrl.c` → `onKeyDown__ctrl__c`). {@link resolveEventListeners}
// then parses them back out and wraps the handler with guards that read the
// terminal event shapes. Mirrors `shentao/vue-global-events`, but for the TUI.

/**
 * Separator the SFC transform uses to encode `v-on` modifiers into a listener
 * prop name (e.g. `@keyDown.ctrl.c` → `onKeyDown__ctrl__c`). Chosen so it never
 * collides with the camelCase TUI event names it is appended to.
 *
 * @internal
 */
export const EVENT_MODIFIER_SEPARATOR = '__'

/** A listener prop is `on` followed by an uppercase letter, per Vue convention. */
const LISTENER_RE = /^on[A-Z]/

/** Modifiers that manage event flow rather than filtering it. */
const FLOW_MODIFIERS: ReadonlySet<string> = new Set(['stop', 'prevent'])

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
    if (FLOW_MODIFIERS.has(modifier)) continue
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
