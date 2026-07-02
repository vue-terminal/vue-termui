import { type BaseRenderable, RenderableEvents } from '@opentui/core'

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
 * Props for any renderable element. These map to the RenderableEvents events.
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
 * Attach RenderableEvents listeners to a component's `emit` function. Should
 * be called within the `setup()` or `onMounted()` lifecycle hooks of a
 * component that wraps a renderable element.
 *
 * @param el - the mounted renderable
 * @param emit - the component's `emit` function
 * @internal
 */
export function setupRenderableEvents(
  el: BaseRenderable,
  // this type is compatible with Vue and simple enough
  // not to abstract
  emit: ((event: 'focus') => void) & ((event: 'blur') => void) & ((event: 'destroyed') => void),
): void {
  el.on(RenderableEvents.FOCUSED, () => emit('focus'))
  el.on(RenderableEvents.BLURRED, () => emit('blur'))
  el.on(RenderableEvents.DESTROYED, () => emit('destroyed'))
}
