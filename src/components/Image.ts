import { VRenderable, RGBA } from '@opentui/core'
import { defineComponent, h } from '@vue/runtime-core'
import type { OptimizedBuffer, RenderContext } from '@opentui/core'
import type { DefineComponent, VNode } from '@vue/runtime-core'

// ══════════════════════════════════════════════════════════════════════
// ImageData & ImageRenderable
// ══════════════════════════════════════════════════════════════════════

/**
 * Raw, tightly packed RGBA8 pixel data.
 *
 * This follows the same byte layout as browser `ImageData.data`: rows are
 * stored top-to-bottom, pixels are stored left-to-right within each row, and
 * each pixel is four bytes in `R, G, B, A` order with channel values `0..255`.
 * The data length must be exactly `width * height * 4`.
 *
 * `width` and `height` are source image pixels, not terminal cells. The natural
 * terminal size is `width` cells wide and `ceil(height / 2)` cells tall because
 * the render path draws two vertical pixels per cell with a lower half block.
 */
export interface ImageData {
  data: Uint8Array
  width: number
  height: number
}

export type ImageSource = string | ArrayBuffer | ArrayBufferView

interface DecodedImage {
  bitmap: {
    data: Uint8Array
    width: number
    height: number
  }
}

interface JimpModule {
  Jimp: {
    read(source: string | ArrayBuffer): Promise<DecodedImage>
  }
}

export interface ImageRenderableOptions {
  imageData?: ImageData | null
  displayWidth?: number
  displayHeight?: number
}

function validateImageData(value: ImageData): void {
  if (!Number.isInteger(value.width) || value.width <= 0) {
    throw new Error('[vue-termui] ImageData.width must be a positive integer.')
  }
  if (!Number.isInteger(value.height) || value.height <= 0) {
    throw new Error('[vue-termui] ImageData.height must be a positive integer.')
  }
  const expectedLength = value.width * value.height * 4
  if (value.data.length !== expectedLength) {
    throw new Error(
      `[vue-termui] ImageData.data must contain width * height * 4 RGBA bytes. Expected ${expectedLength}, got ${value.data.length}.`,
    )
  }
}

function toJimpSource(source: ImageSource): string | ArrayBuffer {
  if (typeof source === 'string' || source instanceof ArrayBuffer) return source

  const bytes = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
  return new Uint8Array(bytes).buffer as ArrayBuffer
}

/**
 * Decode a PNG, JPEG, GIF, BMP or TIFF file/buffer into {@link ImageData}.
 *
 * The returned data is normalized to vue-termui's Image standard: tightly
 * packed RGBA8 bytes in row-major order with no row padding.
 *
 * @example
 * ```ts
 * const logo = await decodeImage('./assets/logo.png')
 * ```
 * ```vue
 * <Image :data="logo" />
 * ```
 */
export async function decodeImage(source: ImageSource): Promise<ImageData> {
  const decoderPackage = 'jimp'
  const { Jimp } = (await import(decoderPackage)) as JimpModule
  const decoded = await Jimp.read(toJimpSource(source))
  const result = {
    data: new Uint8Array(decoded.bitmap.data),
    width: decoded.bitmap.width,
    height: decoded.bitmap.height,
  }

  validateImageData(result)
  return result
}

/**
 * Terminal-native image renderable.
 *
 * Draws RGBA8 pixel data with Unicode half-block cells. Each terminal cell
 * represents two vertical source pixels.
 *
 * @internal — instantiated by `createNodeOps` for `<tui-image>`.
 */
export class ImageRenderable extends VRenderable {
  private _imageData: ImageData | null = null

  constructor(ctx: RenderContext, options: ImageRenderableOptions = {}) {
    if (options.imageData) validateImageData(options.imageData)
    super(ctx, {
      width: options.displayWidth ?? options.imageData?.width ?? 0,
      height: options.displayHeight ?? Math.ceil((options.imageData?.height ?? 0) / 2),
    })
    if (options.imageData) this._imageData = options.imageData
  }

  /** @internal */
  get imageData(): ImageData | null { return this._imageData }
  /** @internal */
  set imageData(value: ImageData | null) {
    if (value) validateImageData(value)
    this._imageData = value
    if (value) {
      this.width = value.width
      this.height = Math.ceil(value.height / 2)
    }
    this.requestRender()
  }

  /** @internal */
  get displayWidth(): number { return this.width }
  /** @internal */
  set displayWidth(value: number) { this.width = value; this.requestRender() }

  /** @internal */
  get displayHeight(): number { return this.height }
  /** @internal */
  set displayHeight(value: number) { this.height = value; this.requestRender() }

  protected override renderSelf(buffer: OptimizedBuffer, _deltaTime: number): void {
    if (!this._imageData?.data.length) return
    const { data, width: w, height: h } = this._imageData

    const cellW = this.width || w
    const cellH = this.height || Math.ceil(h / 2)

    for (let cy = 0; cy < cellH; cy++) {
      for (let cx = 0; cx < cellW; cx++) {
        // Map terminal cell to source pixels
        const srcX = Math.floor((cx / cellW) * w)
        const topY = Math.floor(((cy * 2) / (cellH * 2)) * h)
        const botY = Math.floor(((cy * 2 + 1) / (cellH * 2)) * h)

        const topPx = this.samplePixel(data, w, h, srcX, topY)
        const botPx = this.samplePixel(data, w, h, srcX, botY)

        // Lower half block: fg = bottom pixel, bg = top pixel.
        buffer.setCell(
          this.x + cx,
          this.y + cy,
          '\u2584',
          botPx,
          topPx,
          0,
        )
      }
    }
  }

  /**
   * Sample a pixel at (x,y), clamping to image bounds.
   * Returns an RGBA object compatible with OpenTUI's setCell.
   */
  private samplePixel(data: Uint8Array, w: number, _h: number, x: number, y: number): RGBA {
    x = Math.max(0, Math.min(x, w - 1))
    y = Math.max(0, Math.min(y, Math.floor(data.length / (w * 4)) - 1))
    const off = (y * w + x) * 4
    return RGBA.fromInts(data[off]!, data[off + 1]!, data[off + 2]!, data[off + 3]!)
  }
}

// ══════════════════════════════════════════════════════════════════════
// Image component
// ══════════════════════════════════════════════════════════════════════

export interface ImageProps {
  data?: ImageData | null
  displayWidth?: number
  displayHeight?: number
}

/**
 * Renders raw RGBA8 image data in the terminal.
 *
 * Use {@link decodeImage} for common image files:
 *
 * ```ts
 * const logo = await decodeImage('./logo.png')
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <Image :data="logo" />
 * </template>
 * ```
 */
export const Image: DefineComponent<ImageProps> = /* @__PURE__ */ defineComponent({
  name: 'Image' as const,
  props: {
    data: { type: Object as () => ImageData | null, default: null as ImageData | null },
    displayWidth: { type: Number, default: undefined },
    displayHeight: { type: Number, default: undefined },
  },
  setup(props, { attrs }) {
    return (): VNode =>
      h('tui-image', {
        ...attrs,
        imageData: props.data,
        displayWidth: props.displayWidth,
        displayHeight: props.displayHeight,
      })
  },
})
