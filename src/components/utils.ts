import {
  type BaseRenderable,
  type Renderable,
  type RenderContext,
  RenderableEvents,
} from '@opentui/core'
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
