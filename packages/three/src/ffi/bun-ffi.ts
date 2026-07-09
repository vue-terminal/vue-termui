import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

// A `bun:ffi`-compatible surface over Node's experimental `node:ffi`
// (`--experimental-ffi`), so `bun-webgpu` — written against `bun:ffi` — runs on
// Node. `registerBunFfiHooks()` rewrites its `bun:ffi` imports to this module.
//
// Pointer model: Bun pointers are numbers, node:ffi pointers are bigints. This
// module presents Bun's (numbers everywhere) and converts at each native
// boundary: symbol args/returns, callback args/returns, `ptr()` and
// `toArrayBuffer()`.

/** Bun FFI type names, as accepted by {@link dlopen} and {@link JSCallback}. */
export const FFIType = {
  char: 'char',
  int8_t: 'int8_t',
  i8: 'i8',
  uint8_t: 'uint8_t',
  u8: 'u8',
  int16_t: 'int16_t',
  i16: 'i16',
  uint16_t: 'uint16_t',
  u16: 'u16',
  int32_t: 'int32_t',
  int: 'int',
  i32: 'i32',
  uint32_t: 'uint32_t',
  u32: 'u32',
  int64_t: 'int64_t',
  i64: 'i64',
  uint64_t: 'uint64_t',
  u64: 'u64',
  double: 'double',
  f64: 'f64',
  float: 'float',
  f32: 'f32',
  bool: 'bool',
  ptr: 'ptr',
  pointer: 'pointer',
  void: 'void',
  cstring: 'cstring',
  function: 'function',
  callback: 'callback',
  buffer: 'buffer',
} as const

export type FFIType = (typeof FFIType)[keyof typeof FFIType]

/** Bun pointers are plain numbers. */
export type Pointer = number

export interface FFIFunction {
  args?: readonly FFIType[]
  returns?: FFIType
  threadsafe?: boolean
}

export interface Library<Fns extends Record<string, FFIFunction>> {
  symbols: { [K in keyof Fns]: (...args: any[]) => any }
  close(): void
}

interface NodeSignature {
  arguments: readonly string[]
  return: string
}

interface NodeDynamicLibrary {
  close(): void
  registerCallback(signature: NodeSignature, callback: (...args: unknown[]) => unknown): bigint
  unregisterCallback(pointer: bigint): void
}

interface NodeFfi {
  dlopen(
    path: string | null,
    symbols: Record<string, NodeSignature>,
  ): {
    lib: NodeDynamicLibrary
    functions: Record<string, (...args: unknown[]) => unknown>
  }
  getRawPointer(buffer: ArrayBuffer): bigint
  toArrayBuffer(pointer: bigint, length: number, copy?: boolean): ArrayBuffer
  toString(pointer: bigint): string
  suffix: string
}

let nodeFfiModule: NodeFfi | undefined

// node:ffi loads lazily so importing this module is harmless on runtimes that
// never call into it (Bun resolves the real bun:ffi instead).
function nodeFfi(): NodeFfi {
  if (!nodeFfiModule) {
    try {
      const required = createRequire(import.meta.url)('node:ffi')
      nodeFfiModule = (required.default ?? required) as NodeFfi
    } catch (error) {
      throw new Error(
        '@vue-termui/three requires Node.js >= 26.3.0 started with --experimental-ffi',
        { cause: error },
      )
    }
  }
  return nodeFfiModule
}

/** Platform shared-library suffix (`dylib`, `so`, `dll`). */
export const suffix: string =
  process.platform === 'darwin' ? 'dylib' : process.platform === 'win32' ? 'dll' : 'so'

function toNodeType(type: FFIType | undefined): string {
  switch (type) {
    case undefined:
    case FFIType.void:
      return 'void'
    case FFIType.char:
      return 'char'
    case FFIType.int8_t:
    case FFIType.i8:
      return 'i8'
    case FFIType.uint8_t:
    case FFIType.u8:
      return 'u8'
    case FFIType.int16_t:
    case FFIType.i16:
      return 'i16'
    case FFIType.uint16_t:
    case FFIType.u16:
      return 'u16'
    case FFIType.int32_t:
    case FFIType.int:
    case FFIType.i32:
      return 'i32'
    case FFIType.uint32_t:
    case FFIType.u32:
      return 'u32'
    case FFIType.int64_t:
    case FFIType.i64:
      return 'i64'
    case FFIType.uint64_t:
    case FFIType.u64:
      return 'u64'
    case FFIType.double:
    case FFIType.f64:
      return 'f64'
    case FFIType.float:
    case FFIType.f32:
      return 'f32'
    case FFIType.bool:
      return 'bool'
    case FFIType.ptr:
    case FFIType.pointer:
    case FFIType.function:
    case FFIType.callback:
      return 'pointer'
    case FFIType.cstring:
      return 'string'
    case FFIType.buffer:
      return 'buffer'
    default:
      throw new Error(`Unsupported FFIType: ${String(type)}`)
  }
}

function isPointerType(type: FFIType | undefined): boolean {
  return (
    type === FFIType.ptr ||
    type === FFIType.pointer ||
    type === FFIType.function ||
    type === FFIType.callback
  )
}

function isInt64Type(type: FFIType | undefined): boolean {
  return (
    type === FFIType.i64 ||
    type === FFIType.u64 ||
    type === FFIType.int64_t ||
    type === FFIType.uint64_t
  )
}

function toNodeSignature(definition: FFIFunction): NodeSignature {
  return {
    arguments: (definition.args ?? []).map(toNodeType),
    return: toNodeType(definition.returns),
  }
}

// Addresses must round-trip exactly between number and bigint; a rounded
// pointer would target the wrong memory.
function toNumberPointer(pointer: bigint): Pointer | null {
  if (pointer === 0n) return null
  if (pointer < 0n || pointer > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error(`Pointer exceeds safe integer range: ${pointer}`)
  }
  return Number(pointer)
}

function toAddress(pointer: number | bigint): bigint {
  if (typeof pointer === 'bigint') return pointer
  if (pointer < 0 || !Number.isSafeInteger(pointer)) {
    throw new Error(`Invalid pointer: ${pointer}`)
  }
  return BigInt(pointer)
}

function toNodePointerArg(value: unknown): bigint | ArrayBuffer | ArrayBufferView {
  if (value == null) return 0n
  if (typeof value === 'number' || typeof value === 'bigint') {
    return toAddress(value)
  }
  if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
    return value.byteLength === 0 ? 0n : value
  }
  throw new TypeError(
    'FFI pointer arguments must be a number, bigint, ArrayBuffer, or ArrayBufferView',
  )
}

function toNodeInt64Arg(value: unknown): unknown {
  return typeof value === 'number' ? BigInt(value) : value
}

type ArgConverter = (value: unknown) => unknown

function argConverter(type: FFIType): ArgConverter | undefined {
  if (isPointerType(type)) return toNodePointerArg
  if (isInt64Type(type)) return toNodeInt64Arg
  return undefined
}

function wrapSymbol(
  fn: (...args: unknown[]) => unknown,
  definition: FFIFunction,
): (...args: unknown[]) => unknown {
  const converters = (definition.args ?? []).map(argConverter)
  const convertReturn = isPointerType(definition.returns)
  if (!convertReturn && converters.every((c) => c === undefined)) {
    return fn
  }
  return (...args: unknown[]) => {
    for (let i = 0; i < converters.length; i++) {
      const convert = converters[i]
      if (convert) args[i] = convert(args[i])
    }
    const result = fn(...args)
    return convertReturn ? toNumberPointer(result as bigint) : result
  }
}

/**
 * Opens a native library. Symbol wrappers convert Bun-style args (number
 * pointers, number 64-bit ints) to node:ffi's bigints, and pointer returns
 * back to numbers (`null` for NULL).
 */
export function dlopen<Fns extends Record<string, FFIFunction>>(
  path: string | URL,
  definitions: Fns,
): Library<Fns> {
  const { lib, functions } = nodeFfi().dlopen(
    path instanceof URL ? fileURLToPath(path) : path,
    Object.fromEntries(
      Object.entries(definitions).map(([name, definition]) => [name, toNodeSignature(definition)]),
    ),
  )
  return {
    symbols: Object.fromEntries(
      Object.entries(functions).map(([name, fn]) => [name, wrapSymbol(fn, definitions[name]!)]),
    ) as Library<Fns>['symbols'],
    close: () => lib.close(),
  }
}

// node:ffi ties callbacks to a DynamicLibrary. Trampolines are
// library-agnostic, so register them all on a process handle (`dlopen(null)`)
// shared by every JSCallback.
let callbackRegistry: NodeDynamicLibrary | undefined

function getCallbackRegistry(): NodeDynamicLibrary {
  return (callbackRegistry ??= nodeFfi().dlopen(null, {}).lib)
}

function wrapCallback(
  fn: (...args: unknown[]) => unknown,
  definition: FFIFunction,
): (...args: unknown[]) => unknown {
  const args = definition.args ?? []
  const pointerIndexes = args.flatMap((type, index) => (isPointerType(type) ? [index] : []))
  const convertReturn = isPointerType(definition.returns)
    ? toNodePointerArg
    : isInt64Type(definition.returns)
      ? toNodeInt64Arg
      : undefined
  if (pointerIndexes.length === 0 && !convertReturn) {
    return fn
  }
  return (...callbackArgs: unknown[]) => {
    for (const index of pointerIndexes) {
      callbackArgs[index] = toNumberPointer(callbackArgs[index] as bigint)
    }
    const result = fn(...callbackArgs)
    return convertReturn ? convertReturn(result) : result
  }
}

/**
 * Bun-compatible JS→native callback. Pointer args arrive as numbers (`null`
 * for NULL), like Bun. `close()` releases the native trampoline.
 */
export class JSCallback {
  #pointer: bigint | null

  constructor(fn: (...args: any[]) => any, definition: FFIFunction) {
    if (definition.threadsafe) {
      throw new Error(
        'node:ffi callbacks are same-thread only; threadsafe callbacks are not supported',
      )
    }
    this.#pointer = getCallbackRegistry().registerCallback(
      toNodeSignature(definition),
      wrapCallback(fn, definition),
    )
  }

  get ptr(): Pointer | null {
    return this.#pointer == null ? null : toNumberPointer(this.#pointer)
  }

  get threadsafe(): boolean {
    return false
  }

  close(): void {
    if (this.#pointer != null) {
      getCallbackRegistry().unregisterCallback(this.#pointer)
      this.#pointer = null
    }
  }
}

/** Address of a TypedArray/ArrayBuffer's memory, as a Bun-style number. */
export function ptr(value: ArrayBufferLike | ArrayBufferView): Pointer {
  const ffi = nodeFfi()
  let address: bigint
  if (ArrayBuffer.isView(value)) {
    if (!(value.buffer instanceof ArrayBuffer)) {
      throw new TypeError('ptr() only supports ArrayBuffer-backed views')
    }
    address = ffi.getRawPointer(value.buffer) + BigInt(value.byteOffset)
  } else if (value instanceof ArrayBuffer) {
    address = ffi.getRawPointer(value)
  } else {
    throw new TypeError('ptr() only supports ArrayBuffer and ArrayBufferView')
  }
  // ptr() is only meaningful for non-empty buffers; 0n would read as NULL.
  const pointer = toNumberPointer(address)
  if (pointer == null) {
    throw new Error('ptr() resolved to a NULL address')
  }
  return pointer
}

/**
 * A writable view over native memory. Without `byteLength`, reads up to the
 * NUL terminator like Bun (bun-webgpu uses that for C error strings).
 */
export function toArrayBuffer(
  pointer: number | bigint,
  byteOffset: number = 0,
  byteLength?: number,
): ArrayBuffer {
  const address = toAddress(pointer) + BigInt(byteOffset)
  if (byteLength == null) {
    return new TextEncoder().encode(nodeFfi().toString(address)).buffer as ArrayBuffer
  }
  if (byteLength === 0) return new ArrayBuffer(0)
  return nodeFfi().toArrayBuffer(address, byteLength, false)
}
