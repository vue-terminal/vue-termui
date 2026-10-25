// Image textures in Node, where three's loaders have no decoder
// (`createImageBitmap`/`<img>` do not exist): `NativeImage` decodes the bytes
// into a `DataTexture`.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { DataTexture, RGBAFormat, SRGBColorSpace, UnsignedByteType } from 'three'
import { NativeImage } from 'vue-termui'

/**
 * Decodes PNG/JPEG/WebP/GIF bytes. Rows land top-first like an `ImageBitmap`
 * with `flipY: false` (the glTF convention); pass `flipY` to match what
 * `TextureLoader` gives regular three.js geometry.
 */
export function decodeTexture(
  bytes: Uint8Array | ArrayBuffer,
  { flipY = false }: { flipY?: boolean } = {},
): DataTexture {
  const decoded = NativeImage.decode(bytes)
  const image = flipY ? decoded.flip() : decoded
  try {
    const { width, height } = image
    const pixels = new Uint8Array(width * height * 4)
    image.copyTo(pixels, { stride: width * 4, format: 'rgba8' })
    const texture = new DataTexture(pixels, width, height, RGBAFormat, UnsignedByteType)
    texture.needsUpdate = true
    return texture
  } finally {
    image.dispose()
    if (image !== decoded) decoded.dispose()
  }
}

// Reads from src/assets in dev; in a build Vite rewrites this to the emitted
// dist/assets file (https://vite.dev/guide/assets#new-url-url-import-meta-url).
function assetPath(file: string): string {
  return fileURLToPath(new URL(`../../../../assets/textures/rapier-car/${file}`, import.meta.url))
}

/** Loads a color texture from src/assets, oriented for regular geometry UVs. */
export async function loadTexture(file: string): Promise<DataTexture> {
  const texture = decodeTexture(await readFile(assetPath(file)), { flipY: true })
  texture.colorSpace = SRGBColorSpace
  return texture
}
