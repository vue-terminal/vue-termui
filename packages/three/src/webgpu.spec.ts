// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { installBrowserGlobals } from './webgpu'

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
