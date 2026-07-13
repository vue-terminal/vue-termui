import { execFile, spawn, type ChildProcess } from 'node:child_process'

export interface CameraFrame {
  /** Raw rgba8 pixels, `width * height * 4` bytes. */
  data: Uint8Array
  width: number
  height: number
}

export interface CameraStreamOptions {
  /** Camera index on macOS, `/dev/videoN` index or path on Linux. */
  device?: string | number | undefined
  fps?: number | undefined
  /**
   * Terminal cell pixel aspect (width/height), read at each spawn. Cells are
   * ~half as wide as tall, so fitting the image without compensating would
   * squeeze it horizontally.
   */
  getCellPixelAspect?: (() => number) | undefined
}

const RESTART_DEBOUNCE_MS = 250
const STDERR_TAIL_MAX = 4000

/**
 * Streams raw RGBA frames from the system camera by piping
 * `ffmpeg -f avfoundation` (or `v4l2` on Linux) to stdout. Frames are
 * letterboxed by ffmpeg to exactly the requested size, so consumers always
 * receive `width × height` pixels.
 */
export class CameraStream {
  onFrame: ((frame: CameraFrame) => void) | null = null
  onError: ((message: string) => void) | null = null

  private device: string | number
  private fps: number
  private getCellPixelAspect: () => number
  private width = 0
  private height = 0
  private frameSize = 0
  private child: ChildProcess | null = null
  private pending: Buffer | null = null
  private stderrTail = ''
  private restartTimer: ReturnType<typeof setTimeout> | null = null
  private destroyed = false

  constructor(options: CameraStreamOptions = {}) {
    this.device = options.device ?? 0
    this.fps = options.fps ?? 30
    this.getCellPixelAspect = options.getCellPixelAspect ?? (() => 0.5)
  }

  setDevice(device: string | number): void {
    if (this.device === device) return
    this.device = device
    this.scheduleRestart()
  }

  /** Frame size in pixels (2× the cell area for half-block supersampling). */
  setSize(width: number, height: number): void {
    if (this.width === width && this.height === height) return
    this.width = width
    this.height = height
    this.scheduleRestart()
  }

  destroy(): void {
    this.destroyed = true
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.kill()
  }

  private scheduleRestart(): void {
    if (this.destroyed) return
    this.kill()
    if (this.restartTimer) clearTimeout(this.restartTimer)
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null
      this.spawnProcess()
    }, RESTART_DEBOUNCE_MS)
  }

  private kill(): void {
    const child = this.child
    this.child = null
    this.pending = null
    if (child) {
      child.stdout?.removeAllListeners()
      child.stderr?.removeAllListeners()
      child.removeAllListeners()
      child.kill('SIGKILL')
    }
  }

  private inputArgs(): string[] {
    if (process.platform === 'darwin') {
      // avfoundation refuses to open without a framerate matching the device
      return ['-f', 'avfoundation', '-framerate', String(this.fps), '-i', String(this.device)]
    }
    if (process.platform === 'linux') {
      const path = typeof this.device === 'number' ? `/dev/video${this.device}` : this.device
      return ['-f', 'v4l2', '-i', path]
    }
    throw new Error(`camera capture is not supported on ${process.platform}`)
  }

  private spawnProcess(): void {
    if (this.destroyed || this.width < 2 || this.height < 2) return
    const { width, height, fps } = this
    this.frameSize = width * height * 4

    let inputArgs: string[]
    try {
      inputArgs = this.inputArgs()
    } catch (error) {
      this.onError?.((error as Error).message)
      return
    }

    // Letterbox entirely in ffmpeg so frames always arrive at width × height:
    // pre-stretch the source into buffer-pixel space (buffer pixels are half a
    // cell, so ~1:2), fit, then pad with black.
    const stretch = 1 / this.getCellPixelAspect()
    const filter = [
      // avfoundation timestamps are unreliable; without a rate cap ffmpeg
      // floods the pipe with duplicate frames
      `fps=${fps}`,
      `scale=w=trunc(iw*${stretch}):h=ih`,
      `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
      `pad=${width}:${height}:-1:-1:color=black`,
    ].join(',')

    const child = spawn(
      'ffmpeg',
      [
        ...['-hide_banner', '-loglevel', 'error'],
        ...inputArgs,
        ...['-vf', filter, '-pix_fmt', 'rgba', '-f', 'rawvideo', 'pipe:1'],
      ],
      { stdio: ['ignore', 'pipe', 'pipe'] },
    )

    this.child = child
    this.stderrTail = ''

    child.stdout!.on('data', (chunk: Buffer) => {
      if (this.child === child) this.consume(chunk, width, height)
    })
    child.stderr!.on('data', (chunk: Buffer) => {
      this.stderrTail = (this.stderrTail + chunk.toString()).slice(-STDERR_TAIL_MAX)
    })
    child.on('error', (error) => {
      if (this.child !== child) return
      this.child = null
      this.onError?.(`failed to start ffmpeg: ${error.message}`)
    })
    child.on('exit', (code) => {
      if (this.child !== child || this.destroyed || code === 0) return
      this.child = null
      this.onError?.(this.stderrTail.trim() || `ffmpeg exited with code ${code}`)
    })
  }

  private consume(chunk: Buffer, width: number, height: number): void {
    this.pending = this.pending?.length ? Buffer.concat([this.pending, chunk]) : chunk
    const { frameSize } = this
    if (this.pending.length < frameSize) return
    // Deliver only the newest complete frame so a slow consumer never lags
    // behind the camera.
    const completeFrames = Math.floor(this.pending.length / frameSize)
    const start = (completeFrames - 1) * frameSize
    // Buffer.concat always copies, so this view stays stable after `pending`
    // moves on.
    const data = this.pending.subarray(start, start + frameSize)
    this.pending = this.pending.subarray(completeFrames * frameSize)
    this.onFrame?.({ data, width, height })
  }
}

/**
 * Video capture device names indexed by avfoundation device number. Empty on
 * platforms other than macOS.
 */
export async function listCameraDevices(): Promise<string[]> {
  if (process.platform !== 'darwin') return []
  return new Promise((resolve) => {
    execFile(
      'ffmpeg',
      ['-hide_banner', '-f', 'avfoundation', '-list_devices', 'true', '-i', ''],
      // always "fails" (no valid input); the device list is on stderr
      (_error, _stdout, stderr) => {
        const devices: string[] = []
        let inVideoSection = false
        for (const line of stderr.split('\n')) {
          if (line.includes('video devices')) {
            inVideoSection = true
            continue
          }
          if (line.includes('audio devices')) break
          const match = inVideoSection && line.match(/\] \[(\d+)\] (.+)$/)
          if (match) devices[Number(match[1])] = match[2]!
        }
        resolve(devices)
      },
    )
  })
}
