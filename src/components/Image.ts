import { parseColor, RGBA, VRenderable } from '@opentui/core'
import { defineComponent, h } from '@vue/runtime-core'
import type { OptimizedBuffer, RenderContext } from '@opentui/core'
import type { DefineComponent, VNode } from '@vue/runtime-core'
import type { ColorInput } from './types'

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
  resize(options: { w?: number; h?: number }): DecodedImage
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
  /** Color transparent pixels are composited over. Defaults to white. */
  background?: ColorInput
}

export interface DecodeImageOptions {
  /**
   * Resize to this pixel width before returning. With only one dimension set
   * the aspect ratio is preserved; with both, the image is stretched to fit.
   */
  width?: number
  /**
   * Resize to this pixel height before returning. With only one dimension set
   * the aspect ratio is preserved; with both, the image is stretched to fit.
   */
  height?: number
  /**
   * Flatten transparency onto this color before returning, since terminal
   * cells can't represent it. Defaults to white; pass `false` to keep the
   * alpha channel untouched.
   */
  background?: ColorInput | false
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

// jimp only accepts file paths, Buffers and ArrayBuffers — a typed view (e.g. a
// pooled Buffer or an offset slice) is copied into its own ArrayBuffer: the
// view's `.buffer` would expose the whole pool, not just its byte range.
function toJimpSource(source: ImageSource): string | ArrayBuffer {
  if (typeof source === 'string' || source instanceof ArrayBuffer) return source
  const view = new Uint8Array(source.buffer, source.byteOffset, source.byteLength)
  return new Uint8Array(view).buffer as ArrayBuffer
}

function colorToRgbInts(color: ColorInput): [number, number, number] {
  const [r, g, b] = (typeof color === 'string' ? parseColor(color) : color).toInts()
  return [r!, g!, b!]
}

/** Composites `data`'s alpha in place over `bg` and makes it fully opaque. */
function flattenAlpha(data: Uint8Array, bg: [number, number, number]): void {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]! / 255
    if (a >= 1) continue
    data[i] = Math.round(data[i]! * a + bg[0] * (1 - a))
    data[i + 1] = Math.round(data[i + 1]! * a + bg[1] * (1 - a))
    data[i + 2] = Math.round(data[i + 2]! * a + bg[2] * (1 - a))
    data[i + 3] = 255
  }
}

/**
 * Decode a PNG, JPEG, GIF, BMP or TIFF file/buffer into {@link ImageData}.
 *
 * The returned data is normalized to vue-termui's Image standard: tightly
 * packed RGBA8 bytes in row-major order with no row padding, optionally
 * resized and with transparency flattened (terminal cells are opaque).
 *
 * @example
 * ```ts
 * // fit a large logo into 48 terminal columns
 * const logo = await decodeImage('./assets/logo.png', { width: 48 })
 * ```
 * ```vue
 * <Image :data="logo" />
 * ```
 */
export async function decodeImage(
  source: ImageSource,
  options: DecodeImageOptions = {},
): Promise<ImageData> {
  const decoderPackage = 'jimp'
  let Jimp: JimpModule['Jimp']
  try {
    Jimp = ((await import(decoderPackage)) as JimpModule).Jimp
  } catch {
    throw new Error(
      '[vue-termui] decodeImage() could not load `jimp`. It is a dependency of vue-termui; ' +
        'if it is missing (e.g. pruned install), reinstall with `pnpm install`.',
    )
  }

  let decoded = await Jimp.read(toJimpSource(source))
  if (options.width != null || options.height != null) {
    decoded = decoded.resize({ w: options.width, h: options.height })
  }

  const data = new Uint8Array(decoded.bitmap.data)
  if (options.background !== false) {
    flattenAlpha(
      data,
      options.background != null ? colorToRgbInts(options.background) : [255, 255, 255],
    )
  }

  const result = { data, width: decoded.bitmap.width, height: decoded.bitmap.height }
  validateImageData(result)
  return result
}

/**
 * Terminal-native image renderable.
 *
 * Draws RGBA8 pixel data with Unicode half-block cells. Each terminal cell
 * represents two vertical source pixels. When displayed smaller than the
 * source, covered regions are area-averaged so downsampling stays smooth;
 * transparent pixels are composited over the `background` color.
 *
 * @internal — instantiated by `createNodeOps` for `<tui-image>`.
 */
export class ImageRenderable extends VRenderable {
  private _imageData: ImageData | null = null
  private _background: [number, number, number] = [255, 255, 255]
  // Explicit display sizes survive `imageData` updates; unset ones re-derive
  // from the new data's natural size.
  private _explicitWidth = false
  private _explicitHeight = false

  constructor(ctx: RenderContext, options: ImageRenderableOptions = {}) {
    if (options.imageData) validateImageData(options.imageData)
    super(ctx, {
      width: options.displayWidth ?? options.imageData?.width ?? 0,
      height: options.displayHeight ?? Math.ceil((options.imageData?.height ?? 0) / 2),
    })
    this._explicitWidth = options.displayWidth != null
    this._explicitHeight = options.displayHeight != null
    if (options.background != null) this._background = colorToRgbInts(options.background)
    if (options.imageData) this._imageData = options.imageData
  }

  /** @internal */
  get imageData(): ImageData | null {
    return this._imageData
  }
  /** @internal */
  set imageData(value: ImageData | null) {
    if (value) validateImageData(value)
    this._imageData = value
    if (value) {
      if (!this._explicitWidth) this.width = value.width
      if (!this._explicitHeight) this.height = Math.ceil(value.height / 2)
    }
    this.requestRender()
  }

  /** @internal */
  get displayWidth(): number {
    return this.width
  }
  /** @internal */
  set displayWidth(value: number) {
    this._explicitWidth = true
    this.width = value
    this.requestRender()
  }

  /** @internal */
  get displayHeight(): number {
    return this.height
  }
  /** @internal */
  set displayHeight(value: number) {
    this._explicitHeight = true
    this.height = value
    this.requestRender()
  }

  /** @internal */
  get background(): ColorInput {
    return RGBA.fromInts(...this._background)
  }
  /** @internal */
  set background(value: ColorInput) {
    this._background = colorToRgbInts(value)
    this.requestRender()
  }

  protected override renderSelf(buffer: OptimizedBuffer, _deltaTime: number): void {
    if (!this._imageData?.data.length) return
    const { data, width: w, height: h } = this._imageData

    const cellW = this.width || w
    const cellH = this.height || Math.ceil(h / 2)

    for (let cy = 0; cy < cellH; cy++) {
      for (let cx = 0; cx < cellW; cx++) {
        // Source region covered by this cell. Horizontally the cell maps to
        // [cx, cx+1) of cellW columns; vertically it maps to two pixel rows of
        // the cellH*2 virtual rows. At 1:1 each region is exactly one pixel.
        const x0 = Math.floor((cx * w) / cellW)
        const x1 = Math.min(w, Math.max(x0 + 1, Math.ceil(((cx + 1) * w) / cellW)))
        const topY0 = Math.floor((cy * 2 * h) / (cellH * 2))
        const topY1 = Math.min(h, Math.max(topY0 + 1, Math.ceil(((cy * 2 + 1) * h) / (cellH * 2))))
        const botY0 = Math.floor(((cy * 2 + 1) * h) / (cellH * 2))
        const botY1 = Math.min(h, Math.max(botY0 + 1, Math.ceil(((cy * 2 + 2) * h) / (cellH * 2))))

        // Lower half block: fg = bottom region, bg = top region.
        buffer.setCell(
          this.x + cx,
          this.y + cy,
          '\u2584',
          this.averageRegion(data, w, x0, x1, botY0, botY1),
          this.averageRegion(data, w, x0, x1, topY0, topY1),
          0,
        )
      }
    }
  }

  /**
   * Area-average the source pixels in `[x0, x1) x [y0, y1)`, compositing each
   * over the background before averaging, and return the cell color.
   */
  private averageRegion(
    data: Uint8Array,
    w: number,
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ): RGBA {
    const [bgR, bgG, bgB] = this._background
    let r = 0
    let g = 0
    let b = 0
    let count = 0
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const off = (y * w + x) * 4
        const a = data[off + 3]! / 255
        r += data[off]! * a + bgR * (1 - a)
        g += data[off + 1]! * a + bgG * (1 - a)
        b += data[off + 2]! * a + bgB * (1 - a)
        count++
      }
    }
    return RGBA.fromInts(Math.round(r / count), Math.round(g / count), Math.round(b / count), 255)
  }
}

// ══════════════════════════════════════════════════════════════════════
// Image component
// ══════════════════════════════════════════════════════════════════════

export interface ImageProps {
  data?: ImageData | null
  displayWidth?: number
  displayHeight?: number
  /** Color transparent pixels are composited over. Defaults to white. */
  background?: ColorInput
}

/**
 * Renders raw RGBA8 image data in the terminal.
 *
 * Use {@link decodeImage} for common image files — resize large sources there
 * (`{ width }`) so the data matches the intended terminal size:
 *
 * ```ts
 * const logo = await decodeImage('./logo.png', { width: 48 })
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
    background: { type: [String, Object] as unknown as () => ColorInput, default: undefined },
  },
  setup(props, { attrs }) {
    return (): VNode => {
      // Only forward props that were actually set — `undefined` would clobber
      // the renderable's derived defaults (natural size, white background).
      const nativeProps: Record<string, unknown> = { imageData: props.data }
      if (props.displayWidth != null) nativeProps.displayWidth = props.displayWidth
      if (props.displayHeight != null) nativeProps.displayHeight = props.displayHeight
      if (props.background != null) nativeProps.background = props.background
      return h('tui-image', { ...attrs, ...nativeProps })
    }
  },
})
