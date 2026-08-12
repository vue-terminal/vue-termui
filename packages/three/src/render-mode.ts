import { DEFAULT_ASCII_RAMP } from './shaders/ascii'
import { ASCII_SHAPE_CELL, DEFAULT_ASCII_CONTRAST } from './shaders/ascii-shape'
import { DEFAULT_ASCII_CHARSET } from './shaders/glyph-coverage'

/**
 * How rendered pixels become terminal cells.
 *
 * - `'none'`: one pixel per cell, drawn as a full block.
 * - `'cpu'`: 2x2 pixels per cell collapsed to a half block on the CPU.
 * - `'gpu'`: same 2x2 collapse in a compute shader, as quadrant glyphs.
 * - `'ascii'`: compute shader like `'gpu'`, but each block becomes a text
 *   glyph. See {@link AsciiModeOptions}.
 */
export type RenderModeName = 'none' | 'cpu' | 'gpu' | 'ascii'

/**
 * How the `'ascii'` mode picks a glyph per cell.
 *
 * - `'shape'` (default): matches the light distribution inside a 4x8 pixel
 *   block against per-glyph shape vectors, with contrast enhancement for
 *   sharp edges (after https://alexharri.com/blog/ascii-rendering). The
 *   charset is an unordered glyph pool.
 * - `'ramp'`: maps a 2x2 pixel block's average luminance onto the charset,
 *   ordered darkest to brightest.
 */
export type AsciiStyle = 'ramp' | 'shape'

export interface AsciiModeOptions {
  /**
   * With {@link AsciiModeOptions.style} `'shape'` this is an unordered glyph
   * pool (defaults to all printable ASCII); with `'ramp'` it is ordered
   * darkest to brightest (defaults to `' .:-=+*#%@'`).
   */
  chars?: string
  /**
   * Glyph selection style.
   * @default 'shape'
   */
  style?: AsciiStyle
  /**
   * Contrast-enhancement exponent for the `'shape'` style: 1 disables
   * enhancement, higher values sharpen edges toward a cel-shaded look.
   * @default 2
   */
  contrast?: number
}

/**
 * Cell packing for the quadrant compute shader: `'pre-squeezed'` assumes the
 * scene was rendered at half height and skips the vertical averaging.
 */
export type GpuAlgorithm = 'standard' | 'pre-squeezed'

export interface GpuModeOptions {
  /**
   * @default 'standard'
   */
  algorithm?: GpuAlgorithm
}

/**
 * Render mode, as a bare name or a name with mode-specific options.
 *
 * @example
 * ```ts
 * 'ascii'
 * { name: 'ascii', options: { style: 'ramp', chars: ' .:-=+*#%@' } }
 * { name: 'gpu', options: { algorithm: 'pre-squeezed' } }
 * ```
 */
export type RenderMode =
  | RenderModeName
  | { name: 'none' | 'cpu'; options?: undefined }
  | { name: 'gpu'; options?: GpuModeOptions }
  | { name: 'ascii'; options?: AsciiModeOptions }

/**
 * A {@link RenderMode} with every option filled in. Options of inactive modes
 * are kept so switching modes back and forth preserves them.
 */
export interface RenderModeState {
  name: RenderModeName
  /** `chars` stays undefined until used: its default depends on `style`. */
  ascii: { chars: string | undefined; style: AsciiStyle; contrast: number }
  gpu: { algorithm: GpuAlgorithm }
}

const DEFAULT_RENDER_MODE: RenderModeName = 'gpu'

const CYCLE_ORDER: readonly RenderModeName[] = ['none', 'cpu', 'gpu', 'ascii']

function defaultState(): RenderModeState {
  return {
    name: DEFAULT_RENDER_MODE,
    ascii: { chars: undefined, style: 'shape', contrast: DEFAULT_ASCII_CONTRAST },
    gpu: { algorithm: 'standard' },
  }
}

function isRenderModeState(mode: RenderMode | RenderModeState): mode is RenderModeState {
  return typeof mode !== 'string' && 'ascii' in mode
}

/**
 * Normalizes a {@link RenderMode} into a {@link RenderModeState}, merging its
 * options over `previous` — so a partial update (say, only `contrast`) keeps
 * the rest of that mode's options, and options of the other modes survive.
 *
 * An already-resolved {@link RenderModeState} (e.g. from `getMode()`) is
 * adopted wholesale instead, ignoring `previous`.
 */
export function resolveRenderMode(
  mode: RenderMode | RenderModeState = DEFAULT_RENDER_MODE,
  previous: RenderModeState = defaultState(),
): RenderModeState {
  if (isRenderModeState(mode)) {
    return { name: mode.name, ascii: { ...mode.ascii }, gpu: { ...mode.gpu } }
  }

  const { name, options } = typeof mode === 'string' ? { name: mode, options: undefined } : mode

  return {
    name,
    ascii: { ...previous.ascii, ...(name === 'ascii' ? options : undefined) },
    gpu: { ...previous.gpu, ...(name === 'gpu' ? options : undefined) },
  }
}

/**
 * Next mode in the `none → cpu → gpu → ascii` cycle, keeping every option.
 */
export function cycleRenderMode(state: RenderModeState): RenderModeState {
  const next = CYCLE_ORDER[(CYCLE_ORDER.indexOf(state.name) + 1) % CYCLE_ORDER.length]!
  return { ...state, name: next }
}

/**
 * Render pixels per terminal cell: the shape-vector ASCII shader samples a
 * 4x8 block per cell (matching the ~1:2 cell aspect, so render pixels stay
 * square), every other supersampled mode collapses 2x2.
 */
export function cellSizeFor(state: RenderModeState): { width: number; height: number } {
  if (state.name === 'none') return { width: 1, height: 1 }
  if (state.name === 'ascii' && state.ascii.style === 'shape') return { ...ASCII_SHAPE_CELL }
  return { width: 2, height: 2 }
}

/**
 * Charset the `'ascii'` mode feeds to its shader: a glyph pool for the
 * `'shape'` style, a darkest-to-brightest ramp for `'ramp'`.
 */
export function asciiCharsFor(style: AsciiStyle, chars?: string): string {
  return chars ?? (style === 'shape' ? DEFAULT_ASCII_CHARSET : DEFAULT_ASCII_RAMP)
}
