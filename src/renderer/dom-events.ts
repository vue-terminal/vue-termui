import { KeyEvent, MouseEvent as TuiMouseEvent } from '@opentui/core'

// Vue's `v-on` modifiers (`@keyDown.ctrl.c`, `@mouseDown.right`, `.exact`,
// `.stop`, …) are compiled by `@vue/compiler-dom` into `withKeys`/`withModifiers`
// guards that read a fixed DOM event surface — `event.key`, `event.ctrlKey`,
// `event.button`, and `event.{ctrl,shift,alt,meta}Key` (the last for `.exact`).
// Rather than intercept those at compile time, we make OpenTUI's own event
// objects expose that surface, so Vue's generated guards work against terminal
// events directly and no compiler transform is needed.

// OpenTUI reports Enter as `return`; Vue compares against the DOM
// `KeyboardEvent.key`. Every other name a modifier can target (escape, space,
// arrows, tab, delete, letters, digits) already hyphenates to the matching Vue
// key token, so only Enter needs remapping.
const DOM_KEY_NAMES: Record<string, string> = { return: 'Enter' }

let installed = false

/**
 * Augment OpenTUI's `KeyEvent`/`MouseEvent` prototypes with the DOM-shaped
 * accessors (`key`, `ctrlKey`, `shiftKey`, `altKey`, `metaKey`) that Vue's
 * modifier guards expect. `button`, `stopPropagation()` and `preventDefault()`
 * already exist on the terminal events, so this is the whole compatibility
 * layer. Idempotent; called once when the renderer options are built.
 *
 * `.self` is intentionally unsupported: its guard compares `target` to
 * `currentTarget`, which OpenTUI events don't carry.
 *
 * @internal
 */
export function installDomEventCompat(): void {
  if (installed) return
  installed = true

  Object.defineProperties(KeyEvent.prototype, {
    key: {
      configurable: true,
      get(this: KeyEvent): string {
        return DOM_KEY_NAMES[this.name] ?? this.name
      },
    },
    ctrlKey: {
      configurable: true,
      get(this: KeyEvent): boolean {
        return this.ctrl
      },
    },
    shiftKey: {
      configurable: true,
      get(this: KeyEvent): boolean {
        return this.shift
      },
    },
    altKey: {
      configurable: true,
      get(this: KeyEvent): boolean {
        return this.option
      },
    },
    metaKey: {
      configurable: true,
      get(this: KeyEvent): boolean {
        return this.meta
      },
    },
  })

  Object.defineProperties(TuiMouseEvent.prototype, {
    ctrlKey: {
      configurable: true,
      get(this: TuiMouseEvent): boolean {
        return this.modifiers.ctrl
      },
    },
    shiftKey: {
      configurable: true,
      get(this: TuiMouseEvent): boolean {
        return this.modifiers.shift
      },
    },
    altKey: {
      configurable: true,
      get(this: TuiMouseEvent): boolean {
        return this.modifiers.alt
      },
    },
    metaKey: {
      configurable: true,
      get(): boolean {
        return false
      },
    },
  })
}
