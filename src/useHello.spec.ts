import { describe, it, expect } from 'vitest'
import { useHello } from './useHello'

describe('useHello', () => {
  it('returns a greeting', () => {
    const greeting = useHello('World')
    expect(greeting.value).toBe('Hello, World!')
  })
})
