import { describe, expect, it, vi } from 'vitest'
import { EVENT_MODIFIER_SEPARATOR, resolveEventListeners } from './utils'
import type { KeyEvent } from '../composables/keyboard'

// Minimal fakes for the two event shapes the resolver reasons about. Only the
// fields the modifier guards read are populated.
function keyEvent(overrides: Partial<KeyEvent> = {}): KeyEvent {
  return {
    name: 'a',
    ctrl: false,
    meta: false,
    shift: false,
    option: false,
    sequence: '',
    raw: '',
    eventType: 'press',
    source: 'raw',
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  }
}

interface FakeMouseEvent {
  button: number
  modifiers: { shift: boolean; alt: boolean; ctrl: boolean }
  preventDefault: () => void
  stopPropagation: () => void
}

function mouseEvent(overrides: Partial<FakeMouseEvent> = {}): FakeMouseEvent {
  return {
    button: 0,
    modifiers: { shift: false, alt: false, ctrl: false },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  }
}

// Build an encoded listener prop name the way the SFC transform does.
const enc = (event: string, ...mods: string[]): string =>
  [event, ...mods].join(EVENT_MODIFIER_SEPARATOR)

describe('resolveEventListeners', () => {
  it('returns the same object untouched when nothing is modifier-encoded', () => {
    const onKeyDown = vi.fn()
    const attrs = { onKeyDown, backgroundColor: '#fff', focusable: true }
    const result = resolveEventListeners(attrs)
    expect(result).toBe(attrs)
    expect(result.onKeyDown).toBe(onKeyDown)
  })

  it('preserves non-listener attrs alongside encoded ones', () => {
    const onKeyDown = vi.fn()
    const result = resolveEventListeners({
      backgroundColor: '#fff',
      [enc('onKeyDown', 'enter')]: onKeyDown,
    })
    expect(result.backgroundColor).toBe('#fff')
    // the encoded key is gone, folded into the base event
    expect(result[enc('onKeyDown', 'enter')]).toBeUndefined()
    expect(typeof result.onKeyDown).toBe('function')
  })

  describe('key-name modifiers', () => {
    it('fires only when the key name matches', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({ [enc('onKeyDown', 'enter')]: handler }) as {
        onKeyDown: (e: KeyEvent) => void
      }

      onKeyDown(keyEvent({ name: 'a' }))
      expect(handler).toHaveBeenCalledTimes(0)

      // OpenTUI reports Enter as `return`
      onKeyDown(keyEvent({ name: 'return' }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('supports aliases (esc → escape, space → " ")', () => {
      const esc = vi.fn()
      const space = vi.fn()
      const listeners = resolveEventListeners({
        [enc('onKeyDown', 'esc')]: esc,
        [enc('onKeyDown', 'space')]: space,
      }) as { onKeyDown: (e: KeyEvent) => void }

      listeners.onKeyDown(keyEvent({ name: 'escape' }))
      expect(esc).toHaveBeenCalledTimes(1)

      listeners.onKeyDown(keyEvent({ name: ' ' }))
      expect(space).toHaveBeenCalledTimes(1)
    })

    it('matches any of several key-name modifiers on one binding', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({
        [enc('onKeyDown', 'enter', 'esc')]: handler,
      }) as { onKeyDown: (e: KeyEvent) => void }

      onKeyDown(keyEvent({ name: 'return' }))
      onKeyDown(keyEvent({ name: 'escape' }))
      onKeyDown(keyEvent({ name: 'a' }))
      expect(handler).toHaveBeenCalledTimes(2)
    })
  })

  describe('system modifiers', () => {
    it('requires the system modifier to be held', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({ [enc('onKeyDown', 'ctrl')]: handler }) as {
        onKeyDown: (e: KeyEvent) => void
      }

      onKeyDown(keyEvent({ name: 'c', ctrl: false }))
      expect(handler).toHaveBeenCalledTimes(0)

      onKeyDown(keyEvent({ name: 'c', ctrl: true }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('combines a system modifier with a key name (ctrl+c)', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({
        [enc('onKeyDown', 'ctrl', 'c')]: handler,
      }) as { onKeyDown: (e: KeyEvent) => void }

      onKeyDown(keyEvent({ name: 'c', ctrl: false }))
      onKeyDown(keyEvent({ name: 'x', ctrl: true }))
      expect(handler).toHaveBeenCalledTimes(0)

      onKeyDown(keyEvent({ name: 'c', ctrl: true }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('treats option as an alias for alt on key events', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({ [enc('onKeyDown', 'alt')]: handler }) as {
        onKeyDown: (e: KeyEvent) => void
      }
      onKeyDown(keyEvent({ option: true }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    describe('.exact', () => {
      it('fires only when exactly the listed system modifiers are held', () => {
        const handler = vi.fn()
        const { onKeyDown } = resolveEventListeners({
          [enc('onKeyDown', 'ctrl', 'exact')]: handler,
        }) as { onKeyDown: (e: KeyEvent) => void }

        // extra modifier held → blocked
        onKeyDown(keyEvent({ name: 'c', ctrl: true, shift: true }))
        expect(handler).toHaveBeenCalledTimes(0)

        onKeyDown(keyEvent({ name: 'c', ctrl: true }))
        expect(handler).toHaveBeenCalledTimes(1)
      })

      it('with no system modifiers fires only when none are held', () => {
        const handler = vi.fn()
        const { onKeyDown } = resolveEventListeners({
          [enc('onKeyDown', 'a', 'exact')]: handler,
        }) as { onKeyDown: (e: KeyEvent) => void }

        onKeyDown(keyEvent({ name: 'a', ctrl: true }))
        expect(handler).toHaveBeenCalledTimes(0)

        onKeyDown(keyEvent({ name: 'a' }))
        expect(handler).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('flow modifiers', () => {
    it('.stop calls stopPropagation and .prevent calls preventDefault when the guard passes', () => {
      const handler = vi.fn()
      const { onKeyDown } = resolveEventListeners({
        [enc('onKeyDown', 'stop', 'prevent', 'enter')]: handler,
      }) as { onKeyDown: (e: KeyEvent) => void }

      const blocked = keyEvent({ name: 'a' })
      onKeyDown(blocked)
      expect(blocked.stopPropagation).toHaveBeenCalledTimes(0)
      expect(blocked.preventDefault).toHaveBeenCalledTimes(0)
      expect(handler).toHaveBeenCalledTimes(0)

      const passed = keyEvent({ name: 'return' })
      onKeyDown(passed)
      expect(passed.stopPropagation).toHaveBeenCalledTimes(1)
      expect(passed.preventDefault).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('mouse events', () => {
    it('filters by mouse button (left/middle/right)', () => {
      const handler = vi.fn()
      const { onMouseDown } = resolveEventListeners({
        [enc('onMouseDown', 'right')]: handler,
      }) as { onMouseDown: (e: FakeMouseEvent) => void }

      onMouseDown(mouseEvent({ button: 0 }))
      expect(handler).toHaveBeenCalledTimes(0)

      onMouseDown(mouseEvent({ button: 2 }))
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('reads system modifiers off the mouse `modifiers` object', () => {
      const handler = vi.fn()
      const { onMouseDown } = resolveEventListeners({
        [enc('onMouseDown', 'shift')]: handler,
      }) as { onMouseDown: (e: FakeMouseEvent) => void }

      onMouseDown(mouseEvent({ modifiers: { shift: false, alt: false, ctrl: false } }))
      expect(handler).toHaveBeenCalledTimes(0)

      onMouseDown(mouseEvent({ modifiers: { shift: true, alt: false, ctrl: false } }))
      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('modifiers with no terminal equivalent', () => {
    it('ignores .self / .once / .capture / .passive instead of treating them as key names', () => {
      const onEnter = vi.fn()
      const onSelf = vi.fn()
      const listeners = resolveEventListeners({
        // `.once` has no meaning for a renderable setter: it must not filter.
        [enc('onKeyDown', 'once', 'enter')]: onEnter,
        // `.self` cannot be evaluated here, so the binding still fires.
        [enc('onMouseDown', 'self')]: onSelf,
      }) as {
        onKeyDown: (e: KeyEvent) => void
        onMouseDown: (e: FakeMouseEvent) => void
      }

      listeners.onKeyDown(keyEvent({ name: 'return' }))
      expect(onEnter).toHaveBeenCalledTimes(1)

      listeners.onMouseDown(mouseEvent({ button: 0 }))
      expect(onSelf).toHaveBeenCalledTimes(1)
    })
  })

  describe('merging handlers for one base event', () => {
    it('runs a plain listener always and a modified one only when it matches', () => {
      const always = vi.fn()
      const onEnter = vi.fn()
      const { onKeyDown } = resolveEventListeners({
        onKeyDown: always,
        [enc('onKeyDown', 'enter')]: onEnter,
      }) as { onKeyDown: (e: KeyEvent) => void }

      onKeyDown(keyEvent({ name: 'a' }))
      expect(always).toHaveBeenCalledTimes(1)
      expect(onEnter).toHaveBeenCalledTimes(0)

      onKeyDown(keyEvent({ name: 'return' }))
      expect(always).toHaveBeenCalledTimes(2)
      expect(onEnter).toHaveBeenCalledTimes(1)
    })

    it('combines several modified bindings on the same event', () => {
      const onCtrlC = vi.fn()
      const onEsc = vi.fn()
      const { onKeyDown } = resolveEventListeners({
        [enc('onKeyDown', 'ctrl', 'c')]: onCtrlC,
        [enc('onKeyDown', 'esc')]: onEsc,
      }) as { onKeyDown: (e: KeyEvent) => void }

      onKeyDown(keyEvent({ name: 'c', ctrl: true }))
      expect(onCtrlC).toHaveBeenCalledTimes(1)
      expect(onEsc).toHaveBeenCalledTimes(0)

      onKeyDown(keyEvent({ name: 'escape' }))
      expect(onEsc).toHaveBeenCalledTimes(1)
      expect(onCtrlC).toHaveBeenCalledTimes(1)
    })
  })
})
