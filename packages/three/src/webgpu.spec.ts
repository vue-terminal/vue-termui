// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { installBrowserGlobals, keepNavigatorUserAgent } from './webgpu'

describe('installBrowserGlobals', () => {
  it('stubs browser globals three/webgpu references unguarded in Node', () => {
    installBrowserGlobals()

    // three 0.180 Textures.getSize runs `image instanceof VideoFrame` for
    // every texture, and NodeSampler.setupUV runs `texture.image instanceof
    // ImageBitmap`; neither is guarded with a typeof check, so both globals
    // must exist or the render loop throws a ReferenceError in Node.
    expect(typeof VideoFrame).toBe('function')
    expect(typeof ImageBitmap).toBe('function')

    // our textures are never real VideoFrame/ImageBitmap instances, so the
    // stubbed checks resolve to false instead of throwing.
    expect(({} as unknown) instanceof VideoFrame).toBe(false)
    expect(({} as unknown) instanceof ImageBitmap).toBe(false)
  })
})

describe('keepNavigatorUserAgent', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

  afterEach(() => {
    if (original) Object.defineProperty(globalThis, 'navigator', original)
  })

  /** What bun-webgpu's `setupGlobals` does to the global. */
  function installGpuNavigator(): void {
    Object.defineProperty(globalThis, 'navigator', {
      value: { ...globalThis.navigator, gpu: {} },
      writable: true,
      configurable: true,
    })
  }

  it('re-attaches the userAgent the WebGPU shim drops', () => {
    // bun-webgpu replaces the global with `{ ...navigator, gpu }`, and Node
    // exposes `userAgent` as a prototype getter — which a spread does not copy.
    // three's loaders read it unguarded (GLTFLoader: `userAgent.match(...)`),
    // so losing it turns every GLTF/texture load into a TypeError.
    const userAgent = globalThis.navigator.userAgent
    expect(userAgent).toBeTypeOf('string')

    installGpuNavigator()
    expect((globalThis.navigator as { userAgent?: string }).userAgent).toBeUndefined()

    keepNavigatorUserAgent(userAgent)
    expect(globalThis.navigator.userAgent).toBe(userAgent)
  })

  it('leaves a navigator that kept its userAgent alone', () => {
    keepNavigatorUserAgent('ignored')
    expect(globalThis.navigator.userAgent).not.toBe('ignored')
  })
})
