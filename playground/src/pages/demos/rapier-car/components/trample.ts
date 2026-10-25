// Port of the lab's trample map: a world-aligned trail the car stamps into and
// the grass bends where it is marked. The original paints a 2D canvas; this
// keeps the trail in a Float32Array (no 8-bit fade stall to work around) and
// uploads it as a one-channel DataTexture.
import { ClampToEdgeWrapping, DataTexture, LinearFilter, RedFormat, UnsignedByteType } from 'three'

export interface TrampleSettings {
  /** world extent covered by the map (width = depth), centered on origin */
  size?: number
  /** texels per side */
  resolution?: number
  /** trample fraction removed per second (spring-back speed) */
  recovery?: number
  /** default stamp radius in world units */
  stampRadius?: number
}

export interface TrampleMap {
  texture: DataTexture
  size: number
  originX: number
  originZ: number
  stamp: (x: number, z: number, strength?: number, radius?: number) => void
  update: (delta: number) => void
  dispose: () => void
}

// Below one 8-bit step the texture no longer changes
const MIN_TRAMPLE = 1 / 255

export function createTrampleMap(settings: TrampleSettings = {}): TrampleMap {
  const { size = 100, resolution = 512, recovery = 0.35, stampRadius = 1.6 } = settings

  const trail = new Float32Array(resolution * resolution)
  const texels = new Uint8Array(resolution * resolution)
  const texture = new DataTexture(texels, resolution, resolution, RedFormat, UnsignedByteType)
  texture.wrapS = texture.wrapT = ClampToEdgeWrapping
  texture.magFilter = texture.minFilter = LinearFilter
  texture.generateMipmaps = false
  texture.needsUpdate = true

  const originX = 0
  const originZ = 0
  const pxPerUnit = resolution / size
  // Seconds since the last stamp; once the trail has fully recovered we stop
  // touching the texture so a parked car costs zero uploads
  let idle = Infinity
  const fullRecovery = recovery > 0 ? -Math.log(MIN_TRAMPLE) / recovery : Infinity
  let dirty = false

  // Row 0 is v = 0, matching the shader-side UV: (worldXZ - origin) / size + 0.5
  function stamp(x: number, z: number, strength = 1, radius = stampRadius) {
    const cx = ((x - originX) / size + 0.5) * resolution
    const cy = ((z - originZ) / size + 0.5) * resolution
    const r = radius * pxPerUnit
    const x0 = Math.max(0, Math.floor(cx - r))
    const x1 = Math.min(resolution - 1, Math.ceil(cx + r))
    const y0 = Math.max(0, Math.floor(cy - r))
    const y1 = Math.min(resolution - 1, Math.ceil(cy + r))
    for (let py = y0; py <= y1; py++) {
      for (let px = x0; px <= x1; px++) {
        const d = Math.hypot(px + 0.5 - cx, py + 0.5 - cy)
        if (d >= r) continue
        // the canvas radial gradient, composited source-over in white
        const alpha = strength * (1 - d / r)
        const i = py * resolution + px
        trail[i] += (1 - trail[i]) * alpha
      }
    }
    idle = 0
    dirty = true
  }

  function update(delta: number) {
    idle += delta
    if (idle <= fullRecovery) {
      const fade = Math.exp(-recovery * delta)
      for (let i = 0; i < trail.length; i++) trail[i] *= fade
      dirty = true
    }
    if (!dirty) return
    for (let i = 0; i < trail.length; i++) texels[i] = trail[i] * 255
    texture.needsUpdate = true
    dirty = false
  }

  return {
    texture,
    size,
    originX,
    originZ,
    stamp,
    update,
    dispose: () => texture.dispose(),
  }
}
