import { describe, expect, it } from 'vitest'
import { optionalBooleanProps, optionalProp, propToOptionalBoolean } from './utils'

describe('propToOptionalBoolean', () => {
  it('maps only undefined to undefined', () => {
    expect(propToOptionalBoolean(undefined)).toBe(undefined)
  })

  it('reads a bare attribute (empty string) as true', () => {
    expect(propToOptionalBoolean('')).toBe(true)
  })

  it('keeps booleans as-is', () => {
    expect(propToOptionalBoolean(true)).toBe(true)
    expect(propToOptionalBoolean(false)).toBe(false)
  })

  it('keeps non-boolean values instead of coercing them', () => {
    const sides = ['top', 'bottom']
    expect(propToOptionalBoolean(sides)).toBe(sides)
    expect(propToOptionalBoolean('rounded')).toBe('rounded')
    expect(propToOptionalBoolean(0)).toBe(0)
    expect(propToOptionalBoolean(null)).toBe(null)
    const obj = { a: 1 }
    expect(propToOptionalBoolean(obj)).toBe(obj)
  })
})

describe('optionalProp', () => {
  it('omits the key when the value is undefined', () => {
    expect(optionalProp('borderColor', undefined)).toEqual({})
    expect('borderColor' in optionalProp('borderColor', undefined)).toBe(false)
  })

  it('sets the key for any defined value, including false and null', () => {
    expect(optionalProp('border', false)).toEqual({ border: false })
    expect(optionalProp('border', null)).toEqual({ border: null })
    expect(optionalProp('border', ['top'])).toEqual({ border: ['top'] })
  })
})

describe('optionalBooleanProps', () => {
  it('coerces each key and omits only the undefined ones', () => {
    const props: Record<'focusable' | 'autofocus' | 'border' | 'scrollX' | 'scrollY', unknown> = {
      focusable: '',
      autofocus: false,
      border: ['top', 'bottom'],
      scrollX: undefined,
      scrollY: null,
    }
    expect(
      optionalBooleanProps(props, ['focusable', 'autofocus', 'border', 'scrollX', 'scrollY']),
    ).toEqual({
      focusable: true,
      autofocus: false,
      border: ['top', 'bottom'],
      scrollY: null,
    })
  })

  it('returns an empty object when every key is undefined', () => {
    const props: Record<'focusable', unknown> = { focusable: undefined }
    expect(optionalBooleanProps(props, ['focusable'])).toEqual({})
  })
})
