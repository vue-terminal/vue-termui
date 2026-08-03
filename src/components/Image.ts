import { VRenderable, RGBA } from '@opentui/core'
import { defineComponent, h } from '@vue/runtime-core'
import type { OptimizedBuffer, RenderContext } from '@opentui/core'
import type { DefineComponent, VNode } from '@vue/runtime-core'

// ══════════════════════════════════════════════════════════════════════
// ImageData & ImageRenderable
// ══════════════════════════════════════════════════════════════════════

/** Raw RGBA8 pixel data with source image dimensions. */
export interface ImageData {
  data: Uint8Array
  width: number
  height: number
}

export interface ImageRenderableOptions {
  imageData?: ImageData | null
  displayWidth?: number
  displayHeight?: number
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
 * Pre-scale images with `sharp` (or any decoder) before passing RGBA8
 * pixel data:
 *
 * ```ts
 * import sharp from 'sharp'
 * const { data, info } = await sharp('logo.png')
 *   .resize(80, 60, { fit: 'inside' }).ensureAlpha().raw()
 *   .toBuffer({ resolveWithObject: true })
 * const img = { data: new Uint8Array(data), width: info.width, height: info.height }
 * ```
 *
 * @example
 * ```vue
 * <template>
 *   <Image :data="img" />
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
