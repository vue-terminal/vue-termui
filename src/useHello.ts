import { ref, type Ref } from 'vue'

/**
 * A placeholder composable. Replace with your own.
 *
 * @param name - The name to greet
 * @returns A ref with the greeting message
 */
export function useHello(name: string): Ref<string> {
  return ref(`Hello, ${name}!`)
}
