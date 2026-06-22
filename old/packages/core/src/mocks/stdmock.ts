import { EventEmitter } from 'node:events'
import { SpyInstance } from 'vitest'

export function createStdout() {
  return new StdoutMock() as unknown as WithMocks<
    NodeJS.WriteStream,
    'write' | 'cursorTo'
  >
}
export function createStdin() {
  return new StdinMock() as unknown as WithMocks<
    NodeJS.ReadStream,
    'resume' | 'pause' | 'setEncoding' | 'setRawMode'
  >
}

class StdoutMock extends EventEmitter {
  columns: number = 80
  rows: number = 24

  // mocked functions
  write = vi.fn<
    Parameters<NodeJS.WriteStream['write']>,
    ReturnType<NodeJS.WriteStream['write']>
  >()
  cursorTo = vi.fn<
    Parameters<NodeJS.WriteStream['cursorTo']>,
    ReturnType<NodeJS.WriteStream['cursorTo']>
  >()

  constructor() {
    super()
  }
}

class StdinMock extends EventEmitter {
  isTTY = true

  resume = vi.fn<
    Parameters<NodeJS.ReadStream['resume']>,
    ReturnType<NodeJS.ReadStream['resume']>
  >()
  pause = vi.fn<
    Parameters<NodeJS.ReadStream['pause']>,
    ReturnType<NodeJS.ReadStream['pause']>
  >()
  setEncoding = vi.fn<
    Parameters<NodeJS.ReadStream['setEncoding']>,
    ReturnType<NodeJS.ReadStream['setEncoding']>
  >()
  setRawMode = vi.fn<
    Parameters<NodeJS.ReadStream['setRawMode']>,
    ReturnType<NodeJS.ReadStream['setRawMode']>
  >()

  constructor() {
    super()
  }
}

type WithMocks<T, K extends keyof T> = T & {
  [k in K as T[k] extends (...args: any[]) => any ? k : never]: T[k] extends (
    ...args: any[]
  ) => any
    ? SpyInstance<Parameters<T[k]>, ReturnType<T[k]>> & {
        calls: Parameters<T[k]>[]
        results: ReturnType<T[k]>[]
      }
    : T[k]
}
