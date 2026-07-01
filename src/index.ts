export const version = '0.0.0'

// Re-export the Vue runtime so apps import `h`, `defineComponent`, `ref`, etc.
// from a single runtime-core instance — the same one this custom renderer is
// built on. Importing these from `vue` instead would load a second copy of
// runtime-core and break vnode/instance interop.
export * from '@vue/runtime-core'

export {
  onKeyDown,
  onKeyUp,
  onResize,
  useFocus,
  useFocusManager,
  useInterval,
  useTerminalSize,
  useTimeout,
  useTitle,
} from './composables/index'
export type {
  ElementRef,
  KeyEvent,
  RemoveListener,
  TerminalSize,
  UseFocusManagerReturn,
  UseFocusOptions,
  UseFocusReturn,
} from './composables/index'

export {
  Box,
  Input,
  Markdown,
  Newline,
  ProgressBar,
  Select,
  SyntaxStyle,
  Text,
  Textarea,
} from './components/index'
export type {
  Align,
  BorderStyle,
  BoxProps,
  ColorInput,
  Dimension,
  FlexDirection,
  InputProps,
  Justify,
  MarkdownProps,
  NewlineProps,
  Overflow,
  Position,
  ProgressBarProps,
  SelectOption,
  SelectProps,
  StyleDefinitionInput,
  TextareaProps,
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
