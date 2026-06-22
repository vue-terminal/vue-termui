export const version = '0.0.0'

// Re-export the Vue runtime so apps import `h`, `defineComponent`, `ref`, etc.
// from a single runtime-core instance — the same one this custom renderer is
// built on. Importing these from `vue` instead would load a second copy of
// runtime-core and break vnode/instance interop.
export * from '@vue/runtime-core'

export { useHello } from './useHello'

export { onKeyDown, onKeyUp } from './composables/index'
export type { KeyEvent, RemoveListener } from './composables/index'

export { Box, Newline, Text } from './components/index'
export type {
  Align,
  BorderStyle,
  BoxProps,
  ColorInput,
  Dimension,
  FlexDirection,
  Justify,
  NewlineProps,
  Overflow,
  Position,
  TextProps,
} from './components/index'

export {
  createApp,
  createNodeOps,
  exitInjectionKey,
  rendererInjectionKey,
  useExit,
  useRenderer,
} from './renderer/index'
export type { App, TuiElementTag } from './renderer/index'
