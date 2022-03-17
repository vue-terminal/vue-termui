export { TuiError } from './errors/TuiError'

// all but TuiApp
export {
  TuiBox,
  TuiText,
  TuiNewline,
  TuiLink,
  TuiTextTransform,
} from './components'

export { render } from './renderer'
export { createApp, exitApp } from './app/createApp'
export type { TuiApp } from './app/types'

export {
  useLog,
  logSymbol,
  useRootNode,
  rootNodeSymbol,
  stdoutSymbol,
  useStdout,
} from './injectionSymbols'

export * from './components'

// re-export Vue core APIs
export * from '@vue/runtime-core'

export { onKeypress } from './composables/keyboard'
export { onMouseEvent } from './composables/mouse'
export { onInput } from './composables/input'
export {
  MouseEventType,
  isInputEvent,
  isKeypressEvent,
  isMouseEvent,
} from './input/types'
export type {
  InputEventHandler,
  KeyboardEventHandler,
  KeyboardEventKeyCode,
  KeyboardEventRawHandlerFn,
  KeyboardEventHandlerFn,
  KeypressEvent,
  KeypressEventRaw,
  MouseEvent,
  MouseEventHandler,
  MouseEventButton,
  _InputEventModifiers,
} from './input/types'

export { defineMessage, parseClientMessage, parseServerMessage } from './hmr'
export type {
  TuiWSMessageClient,
  TuiWSMessageServer,
  TuiWSMessage,
  TuiWsMessage_Crash,
  TuiWsMessage_Restart,
} from './hmr'
