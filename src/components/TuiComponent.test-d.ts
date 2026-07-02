import type { InputRenderable, SelectRenderable, TextareaRenderable } from '@opentui/core'
import { h } from '@vue/runtime-core'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { Input } from './Input'
import { Select } from './Select'
import { Textarea } from './Textarea'

// Guards the `TuiComponent` alias: `$el` must be the concrete OpenTUI
// renderable (not `any`), while the component stays a genuine `DefineComponent`
// so `h()`/template prop typing keeps working. See `TuiComponent` in `utils.ts`.
describe('TuiComponent', () => {
  it('exposes Input $el as InputRenderable', () => {
    type El = InstanceType<typeof Input>['$el']
    // The whole point — a plain `DefineComponent<Props>` leaves this `any`.
    expectTypeOf<El>().not.toBeAny()
    // `$el` is `InputRenderable & Element`, so it stays usable as the renderable…
    expectTypeOf<El>().toExtend<InputRenderable>()
    assertType<InputRenderable>({} as El)
    // …and its members resolve rather than collapsing to `never`.
    expectTypeOf<El['value']>().toEqualTypeOf<string>()
  })

  it('exposes Textarea $el as TextareaRenderable', () => {
    type El = InstanceType<typeof Textarea>['$el']
    expectTypeOf<El>().not.toBeAny()
    expectTypeOf<El>().toExtend<TextareaRenderable>()
    assertType<TextareaRenderable>({} as El)
  })

  it('exposes Select $el as SelectRenderable', () => {
    type El = InstanceType<typeof Select>['$el']
    expectTypeOf<El>().not.toBeAny()
    expectTypeOf<El>().toExtend<SelectRenderable>()
    assertType<SelectRenderable>({} as El)
  })

  it('preserves prop typing for h()/templates', () => {
    // Valid props are accepted, including native fall-through options and events.
    h(Input, {
      modelValue: 'x',
      autofocus: true,
      placeholder: 'hi',
      'onUpdate:modelValue': (v: string) => v,
    })
    h(Select, { modelValue: 0, options: [{ name: 'One' }] })

    // `focusable` is shared by every renderable component.
    h(Input, { focusable: false })
    h(Textarea, { focusable: true })
    h(Select, { focusable: false })

    // …and wrong prop types on declared props are still rejected.
    // @ts-expect-error - modelValue must be a string
    h(Input, { modelValue: 123 })
    // @ts-expect-error - focusable must be a boolean
    h(Input, { focusable: 'yes' })
  })
})
