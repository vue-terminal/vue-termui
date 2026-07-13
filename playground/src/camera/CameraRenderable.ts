import {
  RGBA,
  Renderable,
  type CliRenderer,
  type OptimizedBuffer,
  type RenderableOptions,
  type RenderContext,
} from '@opentui/core'
import { CameraStream, type CameraFrame } from './CameraStream'
import { pointerOf } from './ffi'

export interface CameraRenderableOptions extends RenderableOptions<CameraRenderable> {
  device?: string | number | undefined
  fps?: number | undefined
  onError?: ((message: string) => void) | undefined
}

const BLACK = RGBA.fromValues(0, 0, 0, 1)

/**
 * Displays the system camera inside the terminal: a {@link CameraStream}
 * delivers letterboxed RGBA frames sized 2× the cell area, and each render
 * draws the latest one through OptimizedBuffer's half-block supersampling —
 * the same CPU path the three.js renderer uses for its readback.
 */
export class CameraRenderable extends Renderable {
  private stream: CameraStream
  private frame: CameraFrame | null = null

  constructor(ctx: RenderContext, options: CameraRenderableOptions) {
    const { device, fps, onError, ...renderableOptions } = options
    super(ctx, { ...renderableOptions, buffered: true })

    const cliRenderer = ctx as CliRenderer
    this.stream = new CameraStream({
      device,
      fps,
      getCellPixelAspect: () => {
        const resolution = cliRenderer.resolution
        if (resolution && cliRenderer.terminalWidth > 0 && cliRenderer.terminalHeight > 0) {
          const cellWidth = resolution.width / cliRenderer.terminalWidth
          const cellHeight = resolution.height / cliRenderer.terminalHeight
          if (cellWidth > 0 && cellHeight > 0) return cellWidth / cellHeight
        }
        return 0.5
      },
    })
    this.stream.onFrame = (frame) => {
      this.frame = frame
      this.requestRender()
    }
    this.stream.onError = (message) => onError?.(message)

    this.syncStreamSize(this.width, this.height)
  }

  setDevice(device: string | number): void {
    this.stream.setDevice(device)
  }

  protected override onResize(width: number, height: number): void {
    this.syncStreamSize(width, height)
    super.onResize(width, height)
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    const { frame } = this
    if (!frame) return
    // clear because a frame captured before a resize may not cover the buffer
    buffer.clear(BLACK)
    buffer.drawSuperSampleBuffer(
      0,
      0,
      pointerOf(frame.data),
      frame.data.byteLength,
      'rgba8unorm',
      frame.width * 4,
    )
  }

  protected override destroySelf(): void {
    this.stream.destroy()
    super.destroySelf()
  }

  private syncStreamSize(width: number, height: number): void {
    // 2×2 pixels per cell (quadrant supersampling)
    if (width > 0 && height > 0) this.stream.setSize(width * 2, height * 2)
  }
}
