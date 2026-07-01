/**
 * Converts a prop to an optional boolean value. Allows passing down undefined to preserver defaults
 * while considering empty strings like a true value.
 *
 * @internal
 */
export function propToOptionalBoolean(prop: unknown): boolean | undefined {
  return prop == null ? undefined : !(prop === false)
}
