import { CliRenderEvents, RGBA, type CliRenderer, type OptimizedBuffer } from '@opentui/core'
import {
  Color,
  LinearSRGBColorSpace,
  NoToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
} from 'three'
import { WebGPURenderer } from 'three/webgpu'
import { CLICanvas, SuperSampleType, type AsciiStyle, type SuperSampleAlgorithm } from './canvas'
import { ASCII_SHAPE_CELL, DEFAULT_ASCII_CONTRAST } from './shaders/ascii-shape'
import { setupWebGPU } from './webgpu'

// Ported from @opentui/three (WGPURenderer.ts): drives three's WebGPURenderer
// into a CLICanvas and copies the result into an OptimizedBuffer each frame.

export { SuperSampleType }

export interface ThreeCliRendererOptions {
  width: number
  height: number
  focalLength?: number
  backgroundColor?: RGBA
  superSample?: SuperSampleType
  /**
   * Charset for {@link SuperSampleType.ASCII}. With the `'shape'` style this
   * is an unordered glyph pool (defaults to all printable ASCII); with
   * `'ramp'` it is ordered darkest to brightest (defaults to `' .:-=+*#%@'`).
   */
  asciiChars?: string
  /**
   * Glyph selection style for {@link SuperSampleType.ASCII}: `'shape'`
   * (default) matches glyph shapes against the light distribution in each
   * cell; `'ramp'` maps average luminance onto the charset. See
   * {@link AsciiStyle}.
   */
  asciiStyle?: AsciiStyle
  /**
   * Contrast-enhancement exponent for the `'shape'` ASCII style: 1 disables
   * enhancement, higher values sharpen edges toward a cel-shaded look.
   * Defaults to 2.
   */
  asciiContrast?: number
  alpha?: boolean
  /**
   * Enable shadow maps (lights/meshes still need their own
   * `castShadow`/`receiveShadow`). Defaults to `false`, like three.
   */
  shadows?: boolean
  autoResize?: boolean
  libPath?: string
}

export class ThreeCliRenderer {
  private outputWidth: number
  private outputHeight: number
  private renderWidth: number
  private renderHeight: number
  private superSample: SuperSampleType
  private asciiChars?: string
  private asciiStyle: AsciiStyle
  private asciiContrast: number
  private backgroundColor: RGBA = RGBA.fromValues(0, 0, 0, 1)
  private alpha: boolean = false
  private shadows: boolean = false
  private libPath?: string
  private threeRenderer?: WebGPURenderer
  private canvas?: CLICanvas
  private device: GPUDevice | null = null

  private activeCamera: PerspectiveCamera | OrthographicCamera
  private _aspectRatio: number | null = null
  private doRenderStats: boolean = false

  private resizeHandler: (width: number, height: number) => void
  private debugToggleHandler: (enabled: boolean) => void
  private destroyHandler: () => void

  // Stats tracking
  private renderTimeMs: number = 0
  private readbackTimeMs: number = 0
  private totalDrawTimeMs: number = 0

  private renderMethod: (
    root: Scene,
    camera: PerspectiveCamera | OrthographicCamera,
    buffer: OptimizedBuffer,
    deltaTime: number,
  ) => Promise<void> = () => Promise.resolve()

  public get aspectRatio(): number {
    if (this._aspectRatio) return this._aspectRatio
    if (this.cliRenderer.resolution) {
      return this.cliRenderer.resolution.width / this.cliRenderer.resolution.height
    }
    const terminalWidth = process.stdout.columns
    const terminalHeight = process.stdout.rows
    return terminalWidth / (terminalHeight * 2)
  }

  constructor(
    private readonly cliRenderer: CliRenderer,
    options: ThreeCliRendererOptions,
  ) {
    this.outputWidth = options.width
    this.outputHeight = options.height
    this.superSample = options.superSample ?? SuperSampleType.GPU
    this.asciiChars = options.asciiChars
    this.asciiStyle = options.asciiStyle ?? 'shape'
    this.asciiContrast = options.asciiContrast ?? DEFAULT_ASCII_CONTRAST

    const scale = this.renderScale()
    this.renderWidth = this.outputWidth * scale.x
    this.renderHeight = this.outputHeight * scale.y

    this.backgroundColor = options.backgroundColor ?? RGBA.fromValues(0, 0, 0, 1)
    this.alpha = options.alpha ?? false
    this.shadows = options.shadows ?? false
    this.libPath = options.libPath

    if (process.env.CELL_ASPECT_RATIO) {
      this._aspectRatio = parseFloat(process.env.CELL_ASPECT_RATIO)
    }

    // Default active camera; fov derives from the focal length when provided
    const fov = options.focalLength
      ? 2 * Math.atan(this.outputHeight / (2 * options.focalLength)) * (180 / Math.PI)
      : 1
    this.activeCamera = new PerspectiveCamera(fov, this.aspectRatio, 0.1, 1000)
    this.activeCamera.position.set(0, 0, 3)
    this.activeCamera.up.set(0, 1, 0)
    this.activeCamera.lookAt(0, 0, 0)
    this.activeCamera.updateMatrixWorld()

    this.resizeHandler = (width: number, height: number) => {
      this.setSize(width, height, true)
    }

    this.debugToggleHandler = (enabled: boolean) => {
      this.doRenderStats = enabled
    }

    this.destroyHandler = () => {
      this.destroy()
    }

    if (options.autoResize !== false) {
      this.cliRenderer.on('resize', this.resizeHandler)
    }

    this.cliRenderer.on(CliRenderEvents.DEBUG_OVERLAY_TOGGLE, this.debugToggleHandler)
    this.cliRenderer.on(CliRenderEvents.DESTROY, this.destroyHandler)
  }

  public toggleDebugStats(): void {
    this.doRenderStats = !this.doRenderStats
  }

  // Render pixels per terminal cell: the shape-vector ASCII shader samples a
  // 4x8 block per cell (matching the ~1:2 cell aspect, so render pixels stay
  // square), every other supersampled mode collapses 2x2.
  private renderScale(): { x: number; y: number } {
    if (this.superSample === SuperSampleType.NONE) return { x: 1, y: 1 }
    if (this.superSample === SuperSampleType.ASCII && this.asciiStyle === 'shape') {
      return { x: ASCII_SHAPE_CELL.width, y: ASCII_SHAPE_CELL.height }
    }
    return { x: 2, y: 2 }
  }

  async init(): Promise<void> {
    const webgpu = await setupWebGPU(this.libPath)
    this.device = await webgpu.createWebGPUDevice()
    this.canvas = new CLICanvas(
      webgpu,
      this.device,
      this.renderWidth,
      this.renderHeight,
      this.superSample,
      undefined,
      this.asciiChars,
      this.asciiStyle,
      this.asciiContrast,
    )

    try {
      this.threeRenderer = new WebGPURenderer({
        canvas: this.canvas as unknown as HTMLCanvasElement,
        device: this.device,
        alpha: this.alpha,
      })

      this.setBackgroundColor(this.backgroundColor)

      this.threeRenderer.toneMapping = NoToneMapping
      this.threeRenderer.outputColorSpace = LinearSRGBColorSpace

      if (this.shadows) {
        this.threeRenderer.shadowMap.enabled = true
        this.threeRenderer.shadowMap.type = PCFSoftShadowMap
      }

      this.threeRenderer.setSize(this.renderWidth, this.renderHeight, false)
    } catch (error) {
      console.error('Error creating THREE.WebGPURenderer:', error)
      throw error
    }

    await this.threeRenderer.init().then(() => {
      this.renderMethod = this.doDrawScene.bind(this)
    })
  }

  public getSuperSampleAlgorithm(): SuperSampleAlgorithm {
    return this.canvas!.getSuperSampleAlgorithm()
  }

  public setSuperSampleAlgorithm(superSampleAlgorithm: SuperSampleAlgorithm): void {
    this.canvas!.setSuperSampleAlgorithm(superSampleAlgorithm)
  }

  public saveToFile(filePath: string): Promise<void> {
    return this.canvas!.saveToFile(filePath)
  }

  setActiveCamera(camera: PerspectiveCamera | OrthographicCamera): void {
    this.activeCamera = camera
  }

  getActiveCamera(): PerspectiveCamera | OrthographicCamera {
    return this.activeCamera
  }

  public setBackgroundColor(color: RGBA): void {
    this.backgroundColor = color
    const clearColor = new Color(
      this.backgroundColor.r,
      this.backgroundColor.g,
      this.backgroundColor.b,
    )
    const clearAlpha = this.alpha ? this.backgroundColor.a : 1.0
    this.threeRenderer!.setClearColor(clearColor, clearAlpha)
  }

  setSize(width: number, height: number, forceUpdate: boolean = false): void {
    // Check against OUTPUT dimensions
    if (!forceUpdate && this.outputWidth === width && this.outputHeight === height) return

    this.outputWidth = width
    this.outputHeight = height

    const scale = this.renderScale()
    this.renderWidth = this.outputWidth * scale.x
    this.renderHeight = this.outputHeight * scale.y

    this.canvas?.setSize(this.renderWidth, this.renderHeight)

    this.threeRenderer?.setSize(this.renderWidth, this.renderHeight, false)
    this.threeRenderer?.setViewport(0, 0, this.renderWidth, this.renderHeight)

    if (this.activeCamera instanceof PerspectiveCamera) {
      this.activeCamera.aspect = this.aspectRatio
    }
    this.activeCamera.updateProjectionMatrix()
  }

  public async drawScene(root: Scene, buffer: OptimizedBuffer, deltaTime: number): Promise<void> {
    await this.renderMethod(root, this.activeCamera, buffer, deltaTime)

    if (this.doRenderStats) {
      this.renderStats(buffer)
    }
  }

  private rendering: boolean = false
  private destroyed: boolean = false

  async doDrawScene(
    root: Scene,
    camera: PerspectiveCamera | OrthographicCamera,
    buffer: OptimizedBuffer,
    _deltaTime: number,
  ): Promise<void> {
    if (this.rendering) {
      console.warn('ThreeCliRenderer.drawScene was called concurrently, which is not supported.')
      return
    }
    if (this.destroyed) {
      return
    }
    try {
      this.rendering = true

      const totalStart = performance.now()
      const renderStart = performance.now()
      await this.threeRenderer!.render(root, camera)
      this.renderTimeMs = performance.now() - renderStart

      const readbackStart = performance.now()
      await this.canvas!.readPixelsIntoBuffer(buffer)
      this.readbackTimeMs = performance.now() - readbackStart

      this.totalDrawTimeMs = performance.now() - totalStart
    } finally {
      this.rendering = false
    }
  }

  public toggleSuperSampling(): void {
    if (this.superSample === SuperSampleType.NONE) {
      this.superSample = SuperSampleType.CPU
    } else if (this.superSample === SuperSampleType.CPU) {
      this.superSample = SuperSampleType.GPU
    } else if (this.superSample === SuperSampleType.GPU) {
      this.superSample = SuperSampleType.ASCII
    } else {
      this.superSample = SuperSampleType.NONE
    }
    this.canvas!.setSuperSample(this.superSample)
    this.setSize(this.outputWidth, this.outputHeight, true)
  }

  public getSuperSample(): SuperSampleType {
    return this.superSample
  }

  /**
   * Charset used by {@link SuperSampleType.ASCII}: a glyph pool for the
   * `'shape'` style, a darkest-to-brightest ramp for `'ramp'`. Takes effect
   * on the next frame.
   */
  public setAsciiChars(asciiChars: string): void {
    this.asciiChars = asciiChars
    this.canvas?.setAsciiChars(asciiChars)
  }

  public getAsciiChars(): string | undefined {
    return this.canvas?.getAsciiChars() ?? this.asciiChars
  }

  /**
   * Glyph selection style for {@link SuperSampleType.ASCII}. Switching styles
   * resizes the render target (they sample different pixel blocks per cell).
   */
  public setAsciiStyle(asciiStyle: AsciiStyle): void {
    if (this.asciiStyle === asciiStyle) return
    this.asciiStyle = asciiStyle
    this.canvas?.setAsciiStyle(asciiStyle)
    this.setSize(this.outputWidth, this.outputHeight, true)
  }

  public getAsciiStyle(): AsciiStyle {
    return this.asciiStyle
  }

  /**
   * Contrast-enhancement exponent for the `'shape'` ASCII style (1 disables
   * enhancement). Takes effect on the next frame.
   */
  public setAsciiContrast(asciiContrast: number): void {
    this.asciiContrast = asciiContrast
    this.canvas?.setAsciiContrast(asciiContrast)
  }

  public getAsciiContrast(): number {
    return this.canvas?.getAsciiContrast() ?? this.asciiContrast
  }

  public renderStats(buffer: OptimizedBuffer): void {
    const stats = [
      `WebGPU Renderer Stats:`,
      ` Render: ${this.renderTimeMs.toFixed(2)}ms`,
      ` Readback: ${this.readbackTimeMs.toFixed(2)}ms`,
      `  ├ MapAsync: ${this.canvas!.mapAsyncTimeMs.toFixed(2)}ms`,
      `  └ SS Draw: ${this.canvas!.superSampleDrawTimeMs.toFixed(2)}ms`,
      ` Total Draw: ${this.totalDrawTimeMs.toFixed(2)}ms`,
      ` SuperSample: ${this.superSample}`,
      ` SuperSample Algorithm: ${this.getSuperSampleAlgorithm()}`,
    ]
    const startY = 4
    const startX = 2
    const fg = RGBA.fromValues(0.9, 0.9, 0.9, 1.0)
    const bg = RGBA.fromValues(0.1, 0.1, 0.1, 1.0)

    stats.forEach((line, index) => {
      buffer.drawText(line, startX + 1, startY + index, fg, bg)
    })
  }

  public destroy(): void {
    this.destroyed = true

    this.cliRenderer.off('resize', this.resizeHandler)
    this.cliRenderer.off(CliRenderEvents.DEBUG_OVERLAY_TOGGLE, this.debugToggleHandler)

    this.canvas?.destroy()

    if (this.threeRenderer) {
      this.threeRenderer.dispose()
      this.threeRenderer = undefined
    }

    this.canvas = undefined
    this.device = null
    this.renderMethod = () => Promise.resolve()
  }
}
