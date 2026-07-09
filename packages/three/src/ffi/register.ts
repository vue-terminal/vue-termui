import { existsSync } from 'node:fs'
// Namespace import on purpose: Bun does not implement `registerHooks`, and a
// named import would fail ESM validation at load time even though the Bun
// path never calls it.
import nodeModule from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as bunFfiShim from './bun-ffi'
import { suffix } from './bun-ffi'

// bun-webgpu is written for Bun: it statically imports `bun:ffi` and locates
// its native Dawn library by importing the platform package's TypeScript
// entry — Node can resolve neither. Module hooks bridge both:
// - `bun:ffi` resolves to a synthetic module re-exporting the node:ffi shim.
//   The handoff goes through a global instead of a file URL so it works the
//   same whether this package runs bundled (dist) or from source (vitest).
// - `bun-webgpu-<platform>-<arch>/index.ts` resolves to a synthetic module
//   default-exporting the dylib path, found next to that package's
//   package.json through the real import chain.

const SHIM_URL = 'vue-termui:bun-ffi'
const SHIM_GLOBAL = Symbol.for('@vue-termui/three:bun-ffi')
const LIB_URL = 'vue-termui:webgpu-lib'

const PLATFORM_PACKAGE_ENTRY_RE = /^bun-webgpu-[a-z0-9]+-[a-z0-9]+\/index\.ts$/

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
 * Makes bun-webgpu loadable on Node: `bun:ffi` resolves to the node:ffi shim
 * and the platform package's `.ts` entry to its native library path. Must run
 * before anything imports bun-webgpu. No-op on Bun.
 */
export function registerBunFfiHooks(): void {
  if (registered || process.versions.bun) return
  registered = true
  ;(globalThis as Record<PropertyKey, unknown>)[SHIM_GLOBAL] = bunFfiShim
  nodeModule.registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === 'bun:ffi') {
        return { url: SHIM_URL, shortCircuit: true }
      }
      if (PLATFORM_PACKAGE_ENTRY_RE.test(specifier)) {
        // Resolve the package through the real importer (bun-webgpu itself),
        // then point at the prebuilt library next to its package.json.
        const packageJson = nextResolve(specifier.replace(/index\.ts$/, 'package.json'), context)
        const packageDir = dirname(fileURLToPath(packageJson.url))
        for (const name of [`libwebgpu_wrapper.${suffix}`, `webgpu_wrapper.${suffix}`]) {
          const candidate = join(packageDir, name)
          if (existsSync(candidate)) {
            return {
              url: `${LIB_URL}?path=${encodeURIComponent(candidate)}`,
              shortCircuit: true,
            }
          }
        }
        // No prebuilt library: fall through so bun-webgpu reports it.
      }
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      if (url === SHIM_URL) {
        return { format: 'module', source: SHIM_SOURCE, shortCircuit: true }
      }
      if (url.startsWith(`${LIB_URL}?`)) {
        const libPath = new URL(url).searchParams.get('path')!
        return {
          format: 'module',
          source: `export default ${JSON.stringify(libPath)}`,
          shortCircuit: true,
        }
      }
      return nextLoad(url, context)
    },
  })
}
