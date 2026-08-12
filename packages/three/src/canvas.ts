import { RGBA, type OptimizedBuffer } from '@opentui/core'
import {
  asciiCharsFor,
  cellSizeFor,
  resolveRenderMode,
  type RenderMode,
  type RenderModeState,
} from './render-mode'
import { asciiShader } from './shaders/ascii'
import { asciiShapeShader } from './shaders/ascii-shape'
import { supersamplingShader } from './shaders/supersampling'
import type { WebGPUModule } from './webgpu'

// Ported from @opentui/three (canvas.ts): a fake <canvas> backed by
// bun-webgpu's GPUCanvasContextMock that three's WebGPURenderer draws into,
// plus the readback paths that turn rendered pixels into terminal cells.

const WORKGROUP_SIZE = 4
const SUPERSAMPLING_COMPUTE_SHADER = supersamplingShader(WORKGROUP_SIZE)

export interface CLICanvasOptions {
  /**
   * How rendered pixels become terminal cells.
   * @default 'gpu'
   */
  mode?: RenderMode | RenderModeState
}

type GPUCanvasContextMock = InstanceType<WebGPUModule['GPUCanvasContextMock']>

// bun-webgpu extends GPUBuffer with a zero-copy pointer to the mapped range
interface MappedRangePtrBuffer extends GPUBuffer {
  getMappedRangePtr(offset?: number, size?: number): number
}

export class CLICanvas {
  private device: GPUDevice
  private readbackBuffer: GPUBuffer | null = null
  // readback buffer currently used by an in-flight frame (copy + mapAsync);
  // destroying it mid-map aborts the mapping, so retirement is deferred to
  // the frame holding it
  private inFlightReadbackBuffer: GPUBuffer | null = null
  private width: number
  private height: number
  private gpuCanvasContext: GPUCanvasContextMock

  public superSampleDrawTimeMs: number = 0
  public mapAsyncTimeMs: number = 0

  // Compute shader super sampling. Pipelines are cached per shader variant
  // ('quadrant' or 'ascii:<style>:<charset>') so toggling modes or charsets at
  // runtime only compiles each variant once.
  private computePipelines = new Map<string, GPUComputePipeline>()
  private computePipelineLayout: GPUPipelineLayout | null = null
  private computeBindGroupLayout: GPUBindGroupLayout | null = null
  private computeOutputBuffer: GPUBuffer | null = null
  private computeParamsBuffer: GPUBuffer | null = null
  private computeReadbackBuffer: MappedRangePtrBuffer | null = null
  private updateScheduled: boolean = false
  private screenshotGPUBuffer: GPUBuffer | null = null
  private mode: RenderModeState
  private destroyed: boolean = false

  constructor(
    webgpu: WebGPUModule,
    device: GPUDevice,
    width: number,
    height: number,
    options: CLICanvasOptions = {},
  ) {
    this.device = device
    this.width = width
    this.height = height
    this.mode = resolveRenderMode(options.mode)
    this.gpuCanvasContext = new webgpu.GPUCanvasContextMock(
      this as unknown as HTMLCanvasElement,
      width,
      height,
    )
  }

  /**
   * Render pixels per terminal cell for the current mode: 4x8 for
   * shape-vector ASCII, 2x2 for everything else.
   */
  public get cellSize(): { width: number; height: number } {
    return cellSizeFor(this.mode)
  }

  public destroy(): void {
    this.destroyed = true
  }

  /**
   * Switches render mode, merging `mode`'s options over the current ones. The
   * caller owns the render size: modes differ in {@link cellSize}, so a switch
   * that changes it must be followed by a resize to the matching render
   * dimensions. Takes effect on the next frame (a new charset or style
   * compiles a new compute pipeline).
   */
  public setMode(mode: RenderMode | RenderModeState): void {
    this.mode = resolveRenderMode(mode, this.mode)
    this.updateComputeParams()
  }

  public getMode(): Readonly<RenderModeState> {
    return this.mode
  }

  getContext(type: string): GPUCanvasContextMock {
    if (type === 'webgpu') {
      this.updateReadbackBuffer(this.width, this.height)
      this.updateComputeBuffers(this.width, this.height)
      return this.gpuCanvasContext
    }
    throw new Error(`getContext not implemented: ${type}`)
  }

  setSize(width: number, height: number): void {
    this.width = width
    this.height = height
    this.gpuCanvasContext.setSize(width, height)
    this.updateReadbackBuffer(width, height)
    this.scheduleUpdateComputeBuffers()
  }

  addEventListener(event: string, listener: unknown, options?: unknown): void {
    console.error('addEventListener mockCanvas', event, listener, options)
  }

  removeEventListener(event: string, listener: unknown, options?: unknown): void {
    console.error('removeEventListener mockCanvas', event, listener, options)
  }

  dispatchEvent(event: Event): void {
    console.error('dispatchEvent mockCanvas', event)
  }

  public async saveToFile(filePath: string): Promise<void> {
    const bytesPerPixel = 4 // RGBA
    const unalignedBytesPerRow = this.width * bytesPerPixel
    const alignedBytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256
    const textureBufferSize = alignedBytesPerRow * this.height

    if (!this.screenshotGPUBuffer || this.screenshotGPUBuffer.size !== textureBufferSize) {
      if (this.screenshotGPUBuffer) {
        this.screenshotGPUBuffer.destroy()
      }
      this.screenshotGPUBuffer = this.device.createBuffer({
        label: 'Screenshot GPU Buffer',
        size: textureBufferSize,
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
      })
    }

    const texture = this.gpuCanvasContext.getCurrentTexture()

    const commandEncoder = this.device.createCommandEncoder({
      label: 'Screenshot Command Encoder',
    })
    commandEncoder.copyTextureToBuffer(
      { texture },
      {
        buffer: this.screenshotGPUBuffer,
        bytesPerRow: alignedBytesPerRow,
        rowsPerImage: this.height,
      },
      { width: this.width, height: this.height },
    )
    this.device.queue.submit([commandEncoder.finish()])

    await this.screenshotGPUBuffer.mapAsync(GPUMapMode.READ)

    const resultBuffer = this.screenshotGPUBuffer.getMappedRange()
    const pixelData = new Uint8Array(resultBuffer)
    const contextFormat = texture.format
    const isBGRA = contextFormat === 'bgra8unorm'

    // Handle row padding - extract only the actual image data
    const imageData = new Uint8Array(this.width * this.height * 4)
    for (let y = 0; y < this.height; y++) {
      const srcOffset = y * alignedBytesPerRow
      const dstOffset = y * this.width * 4

      if (isBGRA) {
        for (let x = 0; x < this.width; x++) {
          const srcPixelOffset = srcOffset + x * 4
          const dstPixelOffset = dstOffset + x * 4

          imageData[dstPixelOffset] = pixelData[srcPixelOffset + 2]!
          imageData[dstPixelOffset + 1] = pixelData[srcPixelOffset + 1]!
          imageData[dstPixelOffset + 2] = pixelData[srcPixelOffset]!
          imageData[dstPixelOffset + 3] = pixelData[srcPixelOffset + 3]!
        }
      } else {
        imageData.set(pixelData.subarray(srcOffset, srcOffset + this.width * 4), dstOffset)
      }
    }

    const { Jimp } = await import('jimp')
    const image = new Jimp({
      data: Buffer.from(imageData),
      width: this.width,
      height: this.height,
    })

    await image.write(filePath as `${string}.${string}`)
    this.screenshotGPUBuffer.unmap()
  }

  private initComputeCommon(): void {
    if (this.computePipelineLayout) return

    this.computeBindGroupLayout = this.device.createBindGroupLayout({
      label: 'SuperSampling Bind Group Layout',
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          texture: { sampleType: 'float', viewDimension: '2d' },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'storage' },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: { type: 'uniform' },
        },
      ],
    })

    this.computePipelineLayout = this.device.createPipelineLayout({
      label: 'SuperSampling Pipeline Layout',
      bindGroupLayouts: [this.computeBindGroupLayout],
    })

    this.computeParamsBuffer = this.device.createBuffer({
      label: 'SuperSampling Params Buffer',
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    this.updateComputeParams()
  }

  private getComputePipeline(): GPUComputePipeline {
    this.initComputeCommon()

    const isAscii = this.mode.name === 'ascii'
    const { style, chars } = this.mode.ascii
    const charset = asciiCharsFor(style, chars)
    const key = isAscii ? `ascii:${style}:${charset}` : 'quadrant'

    let pipeline = this.computePipelines.get(key)
    if (!pipeline) {
      const shaderModule = this.device.createShaderModule({
        label: `SuperSampling Compute Shader (${key})`,
        code: !isAscii
          ? SUPERSAMPLING_COMPUTE_SHADER
          : style === 'shape'
            ? asciiShapeShader(WORKGROUP_SIZE, charset)
            : asciiShader(WORKGROUP_SIZE, charset),
      })
      pipeline = this.device.createComputePipeline({
        label: `SuperSampling Compute Pipeline (${key})`,
        layout: this.computePipelineLayout!,
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      })
      this.computePipelines.set(key, pipeline)
    }

    return pipeline
  }

  private updateComputeParams(): void {
    if (!this.computeParamsBuffer || this.mode.name === 'none') return

    // this.width/height are render dimensions (cellSize x terminal size when
    // super sampling)
    const paramsData = new ArrayBuffer(16)
    const uint32View = new Uint32Array(paramsData)
    const float32View = new Float32Array(paramsData)

    uint32View[0] = this.width
    uint32View[1] = this.height
    uint32View[2] = this.mode.gpu.algorithm === 'pre-squeezed' ? 1 : 0
    // 4th word is padding for the quadrant shader, the contrast exponent for
    // ascii 'shape'
    float32View[3] = this.mode.ascii.contrast

    this.device.queue.writeBuffer(this.computeParamsBuffer, 0, paramsData)
  }

  private scheduleUpdateComputeBuffers(): void {
    this.updateScheduled = true
  }

  private updateComputeBuffers(width: number, height: number): void {
    if (this.mode.name === 'none') return
    this.updateComputeParams()

    // 48 bytes per cell (2 vec4f + u32 + 3 padding u32s, 16-byte aligned).
    // Must match the WGSL ceil division: (params.width + cellW - 1u) / cellW
    const cellBytesSize = 48
    const { width: cellW, height: cellH } = this.cellSize
    const terminalWidthCells = Math.floor((width + cellW - 1) / cellW)
    const terminalHeightCells = Math.floor((height + cellH - 1) / cellH)
    const outputBufferSize = terminalWidthCells * terminalHeightCells * cellBytesSize

    this.computeOutputBuffer?.destroy()
    this.computeReadbackBuffer?.destroy()

    this.computeOutputBuffer = this.device.createBuffer({
      label: 'SuperSampling Output Buffer',
      size: outputBufferSize,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    })

    this.computeReadbackBuffer = this.device.createBuffer({
      label: 'SuperSampling Readback Buffer',
      size: outputBufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    }) as MappedRangePtrBuffer
  }

  private async runComputeShaderSuperSampling(
    texture: GPUTexture,
    buffer: OptimizedBuffer,
  ): Promise<void> {
    if (this.destroyed) {
      return
    }

    if (this.updateScheduled) {
      this.updateScheduled = false
      await this.device.queue.onSubmittedWorkDone()
      this.updateComputeBuffers(this.width, this.height)
    }

    const computePipeline = this.getComputePipeline()

    if (!this.computeBindGroupLayout || !this.computeOutputBuffer || !this.computeParamsBuffer) {
      throw new Error('Compute pipeline not initialized')
    }

    const mapAsyncStart = performance.now()
    const textureView = texture.createView({
      label: 'SuperSampling Input Texture View',
    })

    const bindGroup = this.device.createBindGroup({
      label: 'SuperSampling Bind Group',
      layout: this.computeBindGroupLayout,
      entries: [
        { binding: 0, resource: textureView },
        { binding: 1, resource: { buffer: this.computeOutputBuffer } },
        { binding: 2, resource: { buffer: this.computeParamsBuffer } },
      ],
    })

    const commandEncoder = this.device.createCommandEncoder({
      label: 'SuperSampling Command Encoder',
    })
    const computePass = commandEncoder.beginComputePass({
      label: 'SuperSampling Compute Pass',
    })
    computePass.setPipeline(computePipeline)
    computePass.setBindGroup(0, bindGroup)

    // Must match the WGSL ceil division: (params.width + cellW - 1u) / cellW
    const { width: cellW, height: cellH } = this.cellSize
    const terminalWidthCells = Math.floor((this.width + cellW - 1) / cellW)
    const terminalHeightCells = Math.floor((this.height + cellH - 1) / cellH)
    const dispatchX = Math.ceil(terminalWidthCells / WORKGROUP_SIZE)
    const dispatchY = Math.ceil(terminalHeightCells / WORKGROUP_SIZE)

    computePass.dispatchWorkgroups(dispatchX, dispatchY, 1)
    computePass.end()

    commandEncoder.copyBufferToBuffer(
      this.computeOutputBuffer,
      0,
      this.computeReadbackBuffer!,
      0,
      this.computeOutputBuffer.size,
    )

    this.device.queue.submit([commandEncoder.finish()])

    await this.computeReadbackBuffer!.mapAsync(GPUMapMode.READ)

    if (this.destroyed) {
      this.computeReadbackBuffer!.unmap()
      return
    }

    const resultsPtr = this.computeReadbackBuffer!.getMappedRangePtr()
    const size = this.computeReadbackBuffer!.size

    this.mapAsyncTimeMs = performance.now() - mapAsyncStart

    const ssStart = performance.now()
    buffer.drawPackedBuffer(resultsPtr, size, 0, 0, terminalWidthCells, terminalHeightCells)
    this.superSampleDrawTimeMs = performance.now() - ssStart

    this.computeReadbackBuffer!.unmap()
  }

  private updateReadbackBuffer(renderWidth: number, renderHeight: number): void {
    if (this.readbackBuffer && this.readbackBuffer !== this.inFlightReadbackBuffer) {
      this.readbackBuffer.destroy()
    }
    const bytesPerPixel = 4 // RGBA8 or BGRA8
    const unalignedBytesPerRow = renderWidth * bytesPerPixel
    const alignedBytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256
    const textureBufferSize = alignedBytesPerRow * renderHeight
    this.readbackBuffer = this.device.createBuffer({
      label: 'Readback Buffer',
      size: textureBufferSize,
      usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    })
  }

  async readPixelsIntoBuffer(buffer: OptimizedBuffer): Promise<void> {
    if (this.destroyed) {
      return
    }

    const texture = this.gpuCanvasContext.getCurrentTexture()
    this.gpuCanvasContext.switchTextures()

    if (this.mode.name === 'gpu' || this.mode.name === 'ascii') {
      await this.runComputeShaderSuperSampling(texture, buffer)
      return
    }

    const textureBuffer = this.readbackBuffer as MappedRangePtrBuffer | null
    if (!textureBuffer) {
      throw new Error('Readback buffer not found')
    }

    this.inFlightReadbackBuffer = textureBuffer
    try {
      const bytesPerPixel = 4 // RGBA8 or BGRA8
      const unalignedBytesPerRow = this.width * bytesPerPixel
      const alignedBytesPerRow = Math.ceil(unalignedBytesPerRow / 256) * 256
      const contextFormat = texture.format

      const commandEncoder = this.device.createCommandEncoder({
        label: 'Readback Command Encoder',
      })
      commandEncoder.copyTextureToBuffer(
        { texture },
        { buffer: textureBuffer, bytesPerRow: alignedBytesPerRow, rowsPerImage: this.height },
        { width: this.width, height: this.height },
      )
      this.device.queue.submit([commandEncoder.finish()])

      const mapStart = performance.now()
      await textureBuffer.mapAsync(GPUMapMode.READ, 0, textureBuffer.size)
      this.mapAsyncTimeMs = performance.now() - mapStart

      if (this.destroyed) {
        textureBuffer.unmap()
        return
      }

      if (this.mode.name === 'cpu') {
        // getMappedRangePtr registers a mapped range too — only request it on
        // the branch that uses it, or the getMappedRange below would overlap
        const bufPtr = textureBuffer.getMappedRangePtr(0, textureBuffer.size)
        const format = contextFormat === 'bgra8unorm' ? 'bgra8unorm' : 'rgba8unorm'
        const ssStart = performance.now()
        buffer.drawSuperSampleBuffer(0, 0, bufPtr, textureBuffer.size, format, alignedBytesPerRow)
        this.superSampleDrawTimeMs = performance.now() - ssStart
      } else {
        this.superSampleDrawTimeMs = 0
        const pixelData = new Uint8Array(textureBuffer.getMappedRange())
        const isBGRA = contextFormat === 'bgra8unorm'
        const backgroundColor = RGBA.fromValues(0, 0, 0, 1)

        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const pixelIndexInPaddedRow = y * alignedBytesPerRow + x * bytesPerPixel

            if (pixelIndexInPaddedRow + 3 >= pixelData.length) continue

            let rByte: number, gByte: number, bByte: number // alpha ignored

            if (isBGRA) {
              bByte = pixelData[pixelIndexInPaddedRow]!
              gByte = pixelData[pixelIndexInPaddedRow + 1]!
              rByte = pixelData[pixelIndexInPaddedRow + 2]!
            } else {
              // Assume RGBA
              rByte = pixelData[pixelIndexInPaddedRow]!
              gByte = pixelData[pixelIndexInPaddedRow + 1]!
              bByte = pixelData[pixelIndexInPaddedRow + 2]!
            }

            const cellColor = RGBA.fromValues(rByte / 255.0, gByte / 255.0, bByte / 255.0, 1.0)

            buffer.setCellWithAlphaBlending(x, y, '█', cellColor, backgroundColor)
          }
        }
      }
    } finally {
      textureBuffer.unmap()
      this.inFlightReadbackBuffer = null
      // a toggle/resize during mapAsync replaced this.readbackBuffer and left
      // this one to us
      if (textureBuffer !== this.readbackBuffer) {
        textureBuffer.destroy()
      }
    }
  }
}
