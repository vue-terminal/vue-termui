import { createRequire } from 'node:module'

// `node:ffi` needs --experimental-ffi (set by the playground scripts) and has
// no type declarations yet.
interface NodeFfi {
  getRawPointer(buffer: ArrayBuffer): bigint
}

let nodeFfi: NodeFfi | undefined

/**
 * Raw pointer to a typed array's memory, as accepted by OptimizedBuffer's
 * native drawing methods (`PointerInput`). ArrayBuffer backing stores never
 * move, so the pointer stays valid for the view's lifetime.
 */
export function pointerOf(view: Uint8Array): bigint {
  if (!nodeFfi) {
    const required = createRequire(import.meta.url)('node:ffi')
    nodeFfi = (required.default ?? required) as NodeFfi
  }
  if (!(view.buffer instanceof ArrayBuffer)) {
    throw new TypeError('pointerOf() only supports ArrayBuffer-backed views')
  }
  return nodeFfi.getRawPointer(view.buffer) + BigInt(view.byteOffset)
}
