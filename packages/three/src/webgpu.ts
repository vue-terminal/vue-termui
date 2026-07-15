import { registerBunFfiHooks } from './ffi/register'

/** The bun-webgpu module, loaded through the bun:ffi shim on Node. */
export type WebGPUModule = typeof import('bun-webgpu')

let webgpuModule: Promise<WebGPUModule> | undefined

/**
 * Loads bun-webgpu; on Node its `bun:ffi` imports and native-library lookup
 * resolve through the module hooks.
 */
export function loadWebGPU(): Promise<WebGPUModule> {
  if (!webgpuModule) {
    registerBunFfiHooks()
    webgpuModule = import('bun-webgpu')
  }
  return webgpuModule
}

/**
 * Installs the browser globals three/webgpu expects but Node lacks. Idempotent
 * (only fills globals that are still undefined) and free of native
 * dependencies, so it is safe to call before the GPU device exists.
 */
export function installBrowserGlobals(): void {
  const g = globalThis as Record<string, unknown>
  // three's internal Animation loop drives itself with
  // `self.requestAnimationFrame`; Bun has both globals, Node has neither.
  // The timers are unref'd so an idle loop never keeps the process alive.
  g.self ??= globalThis
  g.requestAnimationFrame ??= (callback: (time: number) => void) =>
    setTimeout(() => callback(performance.now()), 16).unref()
  g.cancelAnimationFrame ??= (id: NodeJS.Timeout) => clearTimeout(id)
  // three references these WebCodecs/DOM types in unguarded `instanceof`
  // checks (Textures.getSize on VideoFrame for every texture, since 0.180;
  // NodeSampler.setupUV on ImageBitmap). Our images are never such instances,
  // so empty-class stubs make the checks resolve to false instead of throwing.
  g.VideoFrame ??= class VideoFrame {}
  g.ImageBitmap ??= class ImageBitmap {}
}

let globalsReady: Promise<WebGPUModule> | undefined

/**
 * Installs `navigator.gpu` and the `GPU*` globals three/webgpu expects, then
 * resolves to the bun-webgpu module. Idempotent.
 *
 * @param libPath - optional override for the native Dawn library path
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
    installBrowserGlobals()
    await webgpu.setupGlobals({ libPath })
    return webgpu
  }))
}
