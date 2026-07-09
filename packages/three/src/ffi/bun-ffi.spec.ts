// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { dlopen, FFIType, JSCallback, ptr, suffix, toArrayBuffer } from './bun-ffi'

const LIBC = process.platform === 'darwin' ? '/usr/lib/libSystem.B.dylib' : 'libc.so.6'

const libc = dlopen(LIBC, {
  qsort: {
    args: [FFIType.ptr, FFIType.u64, FFIType.u64, FFIType.function],
    returns: FFIType.void,
  },
  strlen: {
    args: [FFIType.cstring],
    returns: FFIType.u64,
  },
  getenv: {
    args: [FFIType.cstring],
    returns: FFIType.ptr,
  },
})

describe('bun:ffi shim', () => {
  it('exposes the platform library suffix', () => {
    expect(suffix).toBe(process.platform === 'darwin' ? 'dylib' : 'so')
  })

  it('calls symbols with pointer and 64-bit int args', () => {
    const values = new Int32Array([5, 4, 9, 1])
    const compare = new JSCallback(
      (a: number, b: number) => {
        const aValue = new DataView(toArrayBuffer(a, 0, 4)).getInt32(0, true)
        const bValue = new DataView(toArrayBuffer(b, 0, 4)).getInt32(0, true)
        return aValue - bValue
      },
      { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    )

    // Bun accepts plain numbers for u64 args; node:ffi requires bigints — the
    // shim must coerce.
    libc.symbols.qsort(ptr(values), values.length, 4, compare.ptr)
    expect([...values]).toEqual([1, 4, 5, 9])
    compare.close()
  })

  it('passes callback pointer args as numbers', () => {
    let receivedType = ''
    const compare = new JSCallback(
      (a: unknown, b: unknown) => {
        receivedType = `${typeof a},${typeof b}`
        return 0
      },
      { args: [FFIType.ptr, FFIType.ptr], returns: FFIType.i32 },
    )
    const values = new Int32Array([2, 1])
    libc.symbols.qsort(ptr(values), 2n, 4n, compare.ptr)
    expect(receivedType).toBe('number,number')
    compare.close()
  })

  it('exposes numeric callback pointers that null out on close', () => {
    const callback = new JSCallback(() => 0, {
      args: [],
      returns: FFIType.i32,
    })
    expect(typeof callback.ptr).toBe('number')
    callback.close()
    expect(callback.ptr).toBeNull()
  })

  it('rejects threadsafe callbacks', () => {
    expect(
      () =>
        new JSCallback(() => {}, {
          args: [],
          returns: FFIType.void,
          threadsafe: true,
        }),
    ).toThrow(/threadsafe/)
  })

  it('marshals cstring args and bigint returns', () => {
    expect(libc.symbols.strlen('hello')).toBe(5n)
  })

  it('converts pointer returns to numbers and reads NUL-terminated memory', () => {
    process.env.VUE_TERMUI_THREE_TEST = 'fractal'
    const value = libc.symbols.getenv('VUE_TERMUI_THREE_TEST') as number
    expect(typeof value).toBe('number')
    // Bun's toArrayBuffer without a length reads to the NUL terminator.
    const text = new TextDecoder().decode(toArrayBuffer(value))
    expect(text).toBe('fractal')
  })

  it('returns null for NULL pointer returns', () => {
    expect(libc.symbols.getenv('VUE_TERMUI_THREE_MISSING')).toBeNull()
  })

  it('creates zero-length and writable views', () => {
    expect(toArrayBuffer(8, 0, 0).byteLength).toBe(0)

    const backing = new Uint8Array([1, 2, 3, 4])
    const view = toArrayBuffer(ptr(backing), 1, 2)
    expect(view.byteLength).toBe(2)
    new Uint8Array(view)[0] = 42
    expect(backing[1]).toBe(42)
  })
})
