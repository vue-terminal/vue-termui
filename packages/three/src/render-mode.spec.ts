import { describe, expect, it } from 'vitest'
import {
  asciiCharsFor,
  cellSizeFor,
  cycleRenderMode,
  resolveRenderMode,
  type RenderModeName,
} from './render-mode'
import { DEFAULT_ASCII_RAMP } from './shaders/ascii'
import { DEFAULT_ASCII_CONTRAST } from './shaders/ascii-shape'
import { DEFAULT_ASCII_CHARSET } from './shaders/glyph-coverage'

describe('resolveRenderMode', () => {
  it('defaults to gpu', () => {
    expect(resolveRenderMode(undefined).name).toBe('gpu')
  })

  it('resolves the string and object forms to the same state', () => {
    expect(resolveRenderMode('ascii')).toEqual(resolveRenderMode({ name: 'ascii' }))
  })

  it('fills in per-mode defaults', () => {
    const state = resolveRenderMode('ascii')
    expect(state.ascii).toEqual({
      chars: undefined,
      style: 'shape',
      contrast: DEFAULT_ASCII_CONTRAST,
    })
    expect(state.gpu).toEqual({ algorithm: 'standard' })
  })

  it('merges options over the previous state', () => {
    const previous = resolveRenderMode({ name: 'ascii', options: { chars: '.#', style: 'ramp' } })
    const next = resolveRenderMode({ name: 'ascii', options: { contrast: 3 } }, previous)

    expect(next.ascii).toEqual({ chars: '.#', style: 'ramp', contrast: 3 })
  })

  it('keeps the options of inactive modes', () => {
    const previous = resolveRenderMode({ name: 'gpu', options: { algorithm: 'pre-squeezed' } })
    const next = resolveRenderMode({ name: 'ascii', options: { chars: '.#' } }, previous)

    expect(next.name).toBe('ascii')
    expect(next.gpu.algorithm).toBe('pre-squeezed')
  })

  it('does not mutate the previous state', () => {
    const previous = resolveRenderMode('ascii')
    resolveRenderMode({ name: 'ascii', options: { contrast: 4 } }, previous)

    expect(previous.ascii.contrast).toBe(DEFAULT_ASCII_CONTRAST)
  })
})

describe('RenderMode', () => {
  it('accepts each mode only with its own options', () => {
    resolveRenderMode({ name: 'ascii', options: { chars: '.#', style: 'ramp', contrast: 2 } })
    resolveRenderMode({ name: 'gpu', options: { algorithm: 'pre-squeezed' } })
    // @ts-expect-error contrast is an ascii option
    resolveRenderMode({ name: 'cpu', options: { contrast: 2 } })
    // @ts-expect-error algorithm is a gpu option
    resolveRenderMode({ name: 'ascii', options: { algorithm: 'standard' } })
    // @ts-expect-error unknown mode
    resolveRenderMode('quadrant')
  })
})

describe('cycleRenderMode', () => {
  it('cycles none -> cpu -> gpu -> ascii -> none', () => {
    const order: RenderModeName[] = ['cpu', 'gpu', 'ascii', 'none']
    let state = resolveRenderMode('none')

    for (const expected of order) {
      state = cycleRenderMode(state)
      expect(state.name).toBe(expected)
    }
  })

  it('preserves per-mode options across a full lap', () => {
    const start = resolveRenderMode({
      name: 'ascii',
      options: { chars: '.#', style: 'ramp', contrast: 3 },
    })

    let state = start
    for (let i = 0; i < 4; i++) state = cycleRenderMode(state)

    expect(state).toEqual(start)
  })
})

describe('cellSizeFor', () => {
  it('samples a 4x8 block per cell for shape-vector ascii', () => {
    expect(cellSizeFor(resolveRenderMode('ascii'))).toEqual({ width: 4, height: 8 })
  })

  it('collapses 2x2 for every other supersampled mode', () => {
    expect(cellSizeFor(resolveRenderMode({ name: 'ascii', options: { style: 'ramp' } }))).toEqual({
      width: 2,
      height: 2,
    })
    expect(cellSizeFor(resolveRenderMode('gpu'))).toEqual({ width: 2, height: 2 })
    expect(cellSizeFor(resolveRenderMode('cpu'))).toEqual({ width: 2, height: 2 })
  })

  it('renders one pixel per cell without supersampling', () => {
    expect(cellSizeFor(resolveRenderMode('none'))).toEqual({ width: 1, height: 1 })
  })
})

describe('asciiCharsFor', () => {
  it('defaults to the glyph pool for shape and the ramp for ramp', () => {
    expect(asciiCharsFor('shape')).toBe(DEFAULT_ASCII_CHARSET)
    expect(asciiCharsFor('ramp')).toBe(DEFAULT_ASCII_RAMP)
  })

  it('honours an explicit charset', () => {
    expect(asciiCharsFor('shape', '.#')).toBe('.#')
  })
})
