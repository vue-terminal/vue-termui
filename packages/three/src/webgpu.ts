import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { suffix } from './ffi/bun-ffi'
import { registerBunFfiHooks } from './ffi/register'

/** The bun-webgpu module, loaded through the bun:ffi shim on Node. */
export type WebGPUModule = typeof import('bun-webgpu')

let webgpuModule: Promise<WebGPUModule> | undefined

/** Loads bun-webgpu; on Node its `bun:ffi` imports resolve to the shim. */
export function loadWebGPU(): Promise<WebGPUModule> {
  if (!webgpuModule) {
    registerBunFfiHooks()
    webgpuModule = import('bun-webgpu')
  }
  return webgpuModule
}

/**
 * Path to the native Dawn library from bun-webgpu's platform package.
 * bun-webgpu's own lookup imports the package's TypeScript entry, which Node
 * refuses to load from node_modules — resolve the binary directly instead.
 */
export function resolveWebGPULibPath(): string {
  const platformPackage = `bun-webgpu-${process.platform}-${process.arch}`
  let packageDir: string
  try {
    // The platform package is a dependency of bun-webgpu, not of this one, so
    // resolve it from bun-webgpu's location (pnpm isolates node_modules).
    const requireHere = createRequire(import.meta.url)
    const requireFromBunWebgpu = createRequire(requireHere.resolve('bun-webgpu'))
    packageDir = dirname(requireFromBunWebgpu.resolve(`${platformPackage}/package.json`))
  } catch (error) {
    throw new Error(
      `WebGPU is not supported on ${process.platform}-${process.arch} (missing optional dependency ${platformPackage})`,
      { cause: error },
    )
  }
  for (const name of [`libwebgpu_wrapper.${suffix}`, `webgpu_wrapper.${suffix}`]) {
    const candidate = join(packageDir, name)
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`No WebGPU native library found in ${packageDir}`)
}

let globalsReady: Promise<WebGPUModule> | undefined

/**
 * Installs `navigator.gpu` and the `GPU*` globals three/webgpu expects, then
 * resolves to the bun-webgpu module. Idempotent.
 */
export function setupWebGPU(libPath?: string): Promise<WebGPUModule> {
  return (globalsReady ??= loadWebGPU().then(async (webgpu) => {
    // Node exposes `navigator` as a getter-only global; bun-webgpu assigns to
    // it. Redefine it as a plain writable property first.
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
    if (descriptor && !descriptor.writable && !descriptor.set) {
      Object.defineProperty(globalThis, 'navigator', {
        value: globalThis.navigator,
        writable: true,
        configurable: true,
      })
    }
    // three's internal Animation loop drives itself with
    // `self.requestAnimationFrame`; Bun has both globals, Node has neither.
    // The timers are unref'd so an idle loop never keeps the process alive.
    const g = globalThis as Record<string, unknown>
    g.self ??= globalThis
    g.requestAnimationFrame ??= (callback: (time: number) => void) =>
      setTimeout(() => callback(performance.now()), 16).unref()
    g.cancelAnimationFrame ??= (id: NodeJS.Timeout) => clearTimeout(id)
    await webgpu.setupGlobals({
      libPath: libPath ?? (process.versions.bun ? undefined : resolveWebGPULibPath()),
    })
    return webgpu
  }))
}
