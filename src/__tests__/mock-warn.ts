// Adapted from https://github.com/posva/jest-mock-warn/blob/master/src/index.js
// Silences `console.warn` / `console.error` during a test run and fails the test
// if a log was emitted but never asserted with the matchers below — keeping the
// test output clean while still forcing intentional logs to be acknowledged.
import type { MockInstance } from 'vitest'
import { afterEach, beforeEach, expect, vi } from 'vitest'

interface CustomMatchers<R = unknown> {
  toHaveBeenWarned: () => R
  toHaveBeenWarnedLast: () => R
  toHaveBeenWarnedTimes: (n: number) => R
  toHaveBeenErrored: () => R
  toHaveBeenErroredLast: () => R
  toHaveBeenErroredTimes: (n: number) => R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

function createMockConsoleMethod(method: 'warn' | 'error') {
  let mockInstance: MockInstance<(typeof console)[typeof method]>
  const asserted = new Map<string, string | RegExp>()

  expect.extend({
    [`toHaveBeen${method.charAt(0).toUpperCase() + method.slice(1)}ed`](received: string | RegExp) {
      asserted.set(received.toString(), received)
      const passed = mockInstance.mock.calls.some((args) =>
        typeof received === 'string'
          ? String(args[0]).includes(received)
          : received.test(String(args[0])),
      )

      return passed
        ? { pass: true, message: () => `expected "${received}" not to have been ${method}ed.` }
        : {
            pass: false,
            message: () => `expected "${received}" to have been ${method}ed.`,
          }
    },

    [`toHaveBeen${method.charAt(0).toUpperCase() + method.slice(1)}edLast`](
      received: string | RegExp,
    ) {
      asserted.set(received.toString(), received)
      const lastCall = String(mockInstance.mock.calls.at(-1)?.[0])
      const passed =
        typeof received === 'string' ? lastCall?.includes(received) : received.test(lastCall)

      return passed
        ? { pass: true, message: () => `expected "${received}" not to have been ${method}ed last.` }
        : {
            pass: false,
            message: () => `expected "${received}" to have been ${method}ed last.`,
          }
    },

    [`toHaveBeen${method.charAt(0).toUpperCase() + method.slice(1)}edTimes`](
      received: string | RegExp,
      n: number,
    ) {
      asserted.set(received.toString(), received)
      const count = mockInstance.mock.calls.filter((args) =>
        typeof received === 'string'
          ? String(args[0]).includes(received)
          : received.test(String(args[0])),
      ).length

      return count === n
        ? {
            pass: true,
            message: () => `expected "${received}" to have been ${method}ed ${n} times.`,
          }
        : {
            pass: false,
            message: () =>
              `expected "${received}" to have been ${method}ed ${n} times but got ${count}.`,
          }
    },
  })

  beforeEach(() => {
    asserted.clear()
    mockInstance = vi.spyOn(console, method).mockImplementation(() => {})
  })

  afterEach(() => {
    const assertedArray = Array.from(asserted)
    const unassertedLogs = mockInstance.mock.calls
      .map((args) => String(args[0]))
      .filter(
        (msg) =>
          !assertedArray.some(([_key, assertedMsg]) =>
            typeof assertedMsg === 'string' ? msg.includes(assertedMsg) : assertedMsg.test(msg),
          ),
      )

    mockInstance.mockRestore()

    if (unassertedLogs.length) {
      unassertedLogs.forEach((msg) => console[method](msg))
      throw new Error(`Test case threw unexpected ${method}s.`, {
        cause: unassertedLogs,
      })
    }
  })
}

/**
 * Mocks `console.warn`, silencing it during the enclosing `describe`. Assert
 * expected warnings with `expect(msg).toHaveBeenWarned()`; any unasserted
 * warning fails the test.
 */
export function mockWarn(): void {
  createMockConsoleMethod('warn')
}

/**
 * Mocks `console.error`, silencing it during the enclosing `describe`. Assert
 * expected errors with `expect(msg).toHaveBeenErrored()`; any unasserted error
 * fails the test.
 */
export function mockConsoleError(): void {
  createMockConsoleMethod('error')
}
