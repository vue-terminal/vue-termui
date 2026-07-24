import {
  Renderable,
  RGBA,
  type CliRenderer,
  type MouseEvent as TuiMouseEvent,
  type OptimizedBuffer,
  type RenderableOptions,
  type RenderContext,
} from '@opentui/core'
import { CLICanvas, setupWebGPU, SuperSampleType } from '@vue-termui/three'
import {
  createShader,
  type PresetConfig,
  type ShaderInstance,
  type ShaderOptions,
} from 'shaders/js'
import {
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  shallowRef,
  useRenderer,
  type DefineComponent,
  type PropType,
  type VNode,
} from 'vue-termui'
import type { BoxRenderable } from '@opentui/core'

// Runs the shaders.com runtime (shaders/js) headless in the terminal: the
// library renders into OpenTUI's CLICanvas (a fake <canvas> backed by Dawn
// WebGPU) on its own animation loop, and this renderable copies the latest
// frame into terminal cells every tick, like ThreeRenderable does for three.

export interface ShadersRenderableOptions extends RenderableOptions<ShadersRenderable> {
  preset: PresetConfig
  shaderOptions?: Pick<ShaderOptions, 'toneMapping' | 'colorSpace'> | undefined
}

export class ShadersRenderable extends Renderable {
  private cliRenderer: CliRenderer
  private preset: PresetConfig
  private shaderOptions: ShadersRenderableOptions['shaderOptions']
  private canvas: CLICanvas | null = null
  private shader: ShaderInstance | null = null
  private initPromise: Promise<boolean> | null = null
  private initFailed = false
  private drawInFlight = false
  private frameCallback: ((deltaTime: number) => Promise<void>) | null = null
  private renderWidth = 2
  private renderHeight = 2
  private clearColor = RGBA.fromValues(0, 0, 0, 1)
  // listeners the shaders runtime registers on window/canvas (mousemove,
  // mousedown, …), re-dispatched from terminal mouse events
  private domListeners = new Map<string, Set<(event: unknown) => void>>()

  constructor(ctx: RenderContext, options: ShadersRenderableOptions) {
    const { preset, shaderOptions, ...renderableOptions } = options
    super(ctx, { ...renderableOptions, buffered: true, live: options.live ?? true })

    const cliRenderer = ctx as CliRenderer
    if (typeof cliRenderer.setFrameCallback !== 'function') {
      throw new Error('ShadersRenderable requires a CliRenderer context')
    }
    this.cliRenderer = cliRenderer
    this.preset = preset
    this.shaderOptions = shaderOptions

    this.frameCallback = async () => {
      if (this.isDestroyed || !this.visible || !this.parent || !this.frameBuffer) return
      await this.draw(this.frameBuffer)
    }
    this.cliRenderer.setFrameCallback(this.frameCallback)
  }

  public get instance(): ShaderInstance | null {
    return this.shader
  }

  public saveToFile(filePath: string): Promise<void> | undefined {
    return this.canvas?.saveToFile(filePath)
  }

  protected override onResize(width: number, height: number): void {
    if (width > 0 && height > 0 && this.canvas) {
      // GPU supersampling renders at 2x the cell grid
      this.renderWidth = width * 2
      this.renderHeight = height * 2
      this.canvas.setSize(this.renderWidth, this.renderHeight)
      this.shader?.resize(this.renderWidth, this.renderHeight)
    }
    super.onResize(width, height)
  }

  protected override onMouseEvent(event: TuiMouseEvent): void {
    const domType =
      event.type === 'move' || event.type === 'drag'
        ? 'mousemove'
        : event.type === 'down'
          ? 'mousedown'
          : event.type === 'up' || event.type === 'drag-end'
            ? 'mouseup'
            : null
    if (domType) {
      // cell → render pixel (GPU supersampling renders 2px per cell), centered
      const clientX = (event.x - this.x) * 2 + 1
      const clientY = (event.y - this.y) * 2 + 1
      const domEvent = {
        clientX,
        clientY,
        button: event.button,
        preventDefault: () => {},
        stopPropagation: () => {},
      }
      for (const listener of this.domListeners.get(domType) ?? []) {
        listener(domEvent)
      }
    }
    super.onMouseEvent(event)
  }

  protected override renderSelf(buffer: OptimizedBuffer): void {
    if (!this.visible || this.isDestroyed) return
    if (this.frameCallback) return
    if (this.buffered && !this.frameBuffer) return
    void this.draw(buffer)
  }

  protected override destroySelf(): void {
    if (this.frameCallback) {
      this.cliRenderer.removeFrameCallback(this.frameCallback)
      this.frameCallback = null
    }
    this.shader?.destroy()
    this.shader = null
    this.canvas?.destroy()
    this.canvas = null
    super.destroySelf()
  }

  private async draw(buffer: OptimizedBuffer): Promise<void> {
    if (this.isDestroyed || this.drawInFlight) return
    this.drawInFlight = true
    try {
      const initialized = await this.ensureInitialized()
      if (!initialized || !this.canvas) return
      buffer.clear(this.clearColor)
      await this.canvas.readPixelsIntoBuffer(buffer)
    } finally {
      this.drawInFlight = false
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    this.initPromise ??= this.init()
      .then(() => true)
      .catch((error) => {
        this.initFailed = true
        console.error('ShadersRenderable init failed:', error)
        return false
      })
    return this.initFailed ? false : this.initPromise
  }

  private async init(): Promise<void> {
    const webgpu = await setupWebGPU()
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) throw new Error('WebGPU adapter unavailable')
    const device = await adapter.requestDevice()

    this.renderWidth = Math.max(1, this.width) * 2
    this.renderHeight = Math.max(1, this.height) * 2
    const canvas = new CLICanvas(
      webgpu,
      device,
      this.renderWidth,
      this.renderHeight,
      SuperSampleType.GPU,
    )

    // DOM surface expected by createShader; sizes must track the render size
    Object.defineProperties(canvas, {
      clientWidth: { get: () => this.renderWidth },
      clientHeight: { get: () => this.renderHeight },
    })
    const captureListener = (type: string, listener: (event: unknown) => void) => {
      let listeners = this.domListeners.get(type)
      if (!listeners) this.domListeners.set(type, (listeners = new Set()))
      listeners.add(listener)
    }
    const releaseListener = (type: string, listener: (event: unknown) => void) => {
      this.domListeners.get(type)?.delete(listener)
    }
    Object.assign(canvas, {
      getBoundingClientRect: () => ({
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: this.renderWidth,
        bottom: this.renderHeight,
        width: this.renderWidth,
        height: this.renderHeight,
      }),
      style: {},
      addEventListener: captureListener,
      removeEventListener: releaseListener,
      dispatchEvent: () => true,
    })
    const g = globalThis as Record<string, unknown>
    g.devicePixelRatio ??= 1
    // the runtime reads window metrics and registers window listeners
    // (mousemove, resize, context-loss); capture them for re-dispatch
    const w = (g.window ?? g) as Record<string, unknown>
    w.addEventListener = captureListener
    w.removeEventListener = releaseListener
    w.dispatchEvent ??= () => true
    w.devicePixelRatio ??= 1
    w.innerWidth ??= 1920
    w.innerHeight ??= 1080

    this.canvas = canvas
    this.shader = await createShader(canvas as unknown as HTMLCanvasElement, this.preset, {
      disableTelemetry: true,
      observeElement: false,
      gpu: { device, adapter },
      ...this.shaderOptions,
    })
    this.shader.resize(this.renderWidth, this.renderHeight)
  }
}

export interface ShadersViewProps {
  /** Preset JSON as exported by shaders.com (get-preset). */
  preset: PresetConfig
  /** Options forwarded to createShader (toneMapping, colorSpace). */
  shaderOptions?: Pick<ShaderOptions, 'toneMapping' | 'colorSpace'>
}

/**
 * Renders a shaders.com preset inside the terminal. Wraps a `tui-box` (all
 * box layout props apply) filled by a {@link ShadersRenderable}.
 */
export const ShadersView: DefineComponent<ShadersViewProps> = defineComponent({
  name: 'ShadersView',
  inheritAttrs: false,
  props: {
    preset: { type: Object as PropType<PresetConfig>, required: true },
    shaderOptions: Object as PropType<ShadersViewProps['shaderOptions']>,
  },
  setup(props, { attrs, expose }) {
    const box = shallowRef<BoxRenderable | null>(null)
    const renderable = shallowRef<ShadersRenderable | null>(null)
    const renderer = useRenderer()

    onMounted(() => {
      const parent = box.value
      if (!parent) return
      const view = new ShadersRenderable(renderer, {
        width: '100%',
        height: '100%',
        preset: props.preset,
        shaderOptions: props.shaderOptions,
      })
      renderable.value = view
      parent.add(view)
    })

    onUnmounted(() => {
      renderable.value?.destroy()
      renderable.value = null
    })

    expose({ renderable })

    return (): VNode =>
      h('tui-box', {
        width: '100%',
        height: '100%',
        ...attrs,
        ref: box,
      })
  },
}) as DefineComponent<ShadersViewProps>
