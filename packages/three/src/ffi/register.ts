import { registerHooks } from 'node:module'
import * as bunFfiShim from './bun-ffi'

// bun-webgpu statically imports `bun:ffi`, which Node cannot resolve. A module
// hook rewrites that specifier to a synthetic module re-exporting the shim.
// The handoff goes through a global instead of a file URL so it works the same
// whether this package runs bundled (dist) or from source (vitest).

const SHIM_URL = 'vue-termui:bun-ffi'
const SHIM_GLOBAL = Symbol.for('@vue-termui/three:bun-ffi')

const SHIM_SOURCE = `
const shim = globalThis[Symbol.for('@vue-termui/three:bun-ffi')]
export const dlopen = shim.dlopen
export const suffix = shim.suffix
export const FFIType = shim.FFIType
export const JSCallback = shim.JSCallback
export const ptr = shim.ptr
export const toArrayBuffer = shim.toArrayBuffer
export default shim
`

let registered = false

/**
 * Makes `import "bun:ffi"` resolve to the node:ffi shim. Must run before
 * anything imports bun-webgpu. No-op on Bun, where bun:ffi is native.
 */
export function registerBunFfiHooks(): void {
  if (registered || process.versions.bun) return
  registered = true
  ;(globalThis as Record<PropertyKey, unknown>)[SHIM_GLOBAL] = bunFfiShim
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'bun:ffi') {
        return { url: SHIM_URL, shortCircuit: true }
      }
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      if (url === SHIM_URL) {
        return { format: 'module', source: SHIM_SOURCE, shortCircuit: true }
      }
      return nextLoad(url, context)
    },
  })
}
