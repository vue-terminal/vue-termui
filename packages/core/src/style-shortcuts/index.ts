import { transformClassToStyleProps } from './transform'

// transforms a class string into an object of props
export function transformClassIntoProps<T extends Record<string, any>>(
  props: T
): T {
  if (!props.class) return props
  return {
    ...props,
    ...transformClassToStyleProps(props.class),
  }
}
