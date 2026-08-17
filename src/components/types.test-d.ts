import type {
  BoxRenderable,
  InputRenderable,
  KeyEvent as OpenTuiKeyEvent,
  MarkdownRenderable,
  MouseEvent as OpenTuiMouseEvent,
  PasteEvent as OpenTuiPasteEvent,
  Renderable,
  ScrollBoxRenderable,
  SelectRenderable,
  TabSelectRenderable,
  TextRenderable,
  TextareaRenderable,
} from '@opentui/core'
import { describe, expectTypeOf, it } from 'vitest'
import { decodePasteBytes, onPaste } from '../index'
import type {
  BoxElement,
  InputElement,
  KeyEvent,
  MarkdownElement,
  MouseEvent,
  PasteEvent,
  ScrollBoxElement,
  SelectElement,
  TabSelectElement,
  TextElement,
  TextareaElement,
  TuiElement,
} from '../index'

// Guards the public element aliases and event mirrors: apps type template refs
// and handlers with these instead of importing from `@opentui/core`, so each
// must stay interchangeable with the engine type it stands for.
describe('public element aliases', () => {
  it('match the renderable behind each component', () => {
    expectTypeOf<TuiElement>().toEqualTypeOf<Renderable>()
    expectTypeOf<BoxElement>().toEqualTypeOf<BoxRenderable>()
    expectTypeOf<TextElement>().toEqualTypeOf<TextRenderable>()
    expectTypeOf<InputElement>().toEqualTypeOf<InputRenderable>()
    expectTypeOf<TextareaElement>().toEqualTypeOf<TextareaRenderable>()
    expectTypeOf<SelectElement>().toEqualTypeOf<SelectRenderable>()
    expectTypeOf<TabSelectElement>().toEqualTypeOf<TabSelectRenderable>()
    expectTypeOf<ScrollBoxElement>().toEqualTypeOf<ScrollBoxRenderable>()
    expectTypeOf<MarkdownElement>().toEqualTypeOf<MarkdownRenderable>()
  })
})

describe('public event mirrors', () => {
  it('accept the engine events, so handlers typed with them just work', () => {
    expectTypeOf<OpenTuiMouseEvent>().toExtend<MouseEvent>()
    expectTypeOf<OpenTuiKeyEvent>().toExtend<KeyEvent>()
    expectTypeOf<OpenTuiPasteEvent>().toExtend<PasteEvent>()
  })
})

// `PasteEvent.bytes` is a `Uint8Array`, so apps need the decoder to reach the
// pasted text; it must stay reachable without importing `@opentui/core`.
describe('paste public surface', () => {
  it('exposes the composable and the byte decoder', () => {
    expectTypeOf(onPaste).parameter(0).parameter(0).toExtend<PasteEvent>()
    expectTypeOf(decodePasteBytes).toBeCallableWith(new Uint8Array())
    expectTypeOf(decodePasteBytes(new Uint8Array())).toBeString()
  })
})
