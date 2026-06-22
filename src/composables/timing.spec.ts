import { effectScope } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInterval, useTimeout } from './timing'

describe('timing composables', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('useInterval runs repeatedly and stops with the returned function', () => {
    let calls = 0
    const stop = useInterval(() => calls++, 100)
    vi.advanceTimersByTime(350)
    expect(calls).toBe(3)
    stop()
    vi.advanceTimersByTime(500)
    expect(calls).toBe(3)
  })

  it('useInterval clears itself when its effect scope is disposed', () => {
    let calls = 0
    const scope = effectScope()
    scope.run(() => useInterval(() => calls++, 100))
    vi.advanceTimersByTime(250)
    expect(calls).toBe(2)
    scope.stop()
    vi.advanceTimersByTime(500)
    expect(calls).toBe(2)
  })

  it('useTimeout runs once after the delay', () => {
    let calls = 0
    useTimeout(() => calls++, 200)
    vi.advanceTimersByTime(199)
    expect(calls).toBe(0)
    vi.advanceTimersByTime(1)
    expect(calls).toBe(1)
  })

  it('useTimeout is cancelled when its effect scope is disposed', () => {
    let calls = 0
    const scope = effectScope()
    scope.run(() => useTimeout(() => calls++, 200))
    scope.stop()
    vi.advanceTimersByTime(500)
    expect(calls).toBe(0)
  })
})
