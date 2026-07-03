export const version = '0.0.0'

// Re-export the Vue runtime so apps import `h`, `defineComponent`, `ref`, etc.
// from a single runtime-core instance — the same one this custom renderer is
// built on. Importing these from `vue` instead would load a second copy of
// runtime-core and break vnode/instance interop.
export * from '@vue/runtime-core'

export { useFocus, useFocusManager, useCurrentFocusedElement } from './composables/focus'
export type {
  ElementRef,
  UseFocusManagerReturn,
  UseFocusOptions,
  UseFocusReturn,
} from './composables/focus'
export { onKeyDown, onKeyUp } from './composables/keyboard'
export type { KeyEvent } from './composables/keyboard'
export { onResize, useTerminalSize, useTitle } from './composables/screen'
export type { TerminalSize } from './composables/screen'
export { useInterval, useTimeout } from './composables/timing'
export type { RemoveListener } from './utils/types'

export { Box } from './components/Box'
export type { BoxProps } from './components/Box'
export { Text } from './components/Text'
export type { TextProps } from './components/Text'
export { Newline } from './components/Newline'
export type { NewlineProps } from './components/Newline'
export { Input } from './components/Input'
export type { InputProps } from './components/Input'
export { Textarea } from './components/Textarea'
export type { TextareaProps } from './components/Textarea'
export { Select } from './components/Select'
export type { SelectOption, SelectProps } from './components/Select'
export { ProgressBar } from './components/ProgressBar'
export type { ProgressBarProps } from './components/ProgressBar'
export { Markdown, SyntaxStyle } from './components/Markdown'
export type { MarkdownProps, StyleDefinitionInput } from './components/Markdown'
export type {
  Align,
  BorderStyle,
  ColorInput,
  Dimension,
  FlexDirection,
  Justify,
  Overflow,
  Position,
} from './components/types'

export {
  createApp,
  createNodeOps,
  exitInjectionKey,
  rendererInjectionKey,
  useExit,
  useRenderer,
} from './renderer/index'
export type { App, TuiElementTag } from './renderer/index'
