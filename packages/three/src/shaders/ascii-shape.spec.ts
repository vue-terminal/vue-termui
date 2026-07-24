import { describe, expect, it } from 'vitest'
import { asciiShapeShader } from './ascii-shape'
import { DEFAULT_ASCII_CHARSET } from './glyph-coverage'

describe('asciiShapeShader', () => {
  it('embeds the charset codepoints in order', () => {
    const code = asciiShapeShader(4, ' .@')
    expect(code).toContain('array<u32, 3>(32u, 46u, 64u)')
  })

  it('defaults to the full printable ASCII charset', () => {
    expect(asciiShapeShader(4)).toContain(`array<u32, ${DEFAULT_ASCII_CHARSET.length}>`)
  })

  it('dedupes repeated charset characters', () => {
    expect(asciiShapeShader(4, ' ..@@')).toContain('array<u32, 3>(32u, 46u, 64u)')
  })

  it('normalizes shape vectors per component across the charset', () => {
    // '-' only has ink in the middle band, so it is the per-component max
    // there and normalizes to exactly 1; empty components stay 0
    const code = asciiShapeShader(4, ' -')
    expect(code).toContain('0.0000, 0.0000, 1.0000, 1.0000, 0.0000, 0.0000')
  })

  it('interpolates the workgroup size', () => {
    expect(asciiShapeShader(8)).toContain('@workgroup_size(8, 8, 1)')
  })

  it('rejects characters without coverage data, naming them', () => {
    expect(() => asciiShapeShader(4, ' .⚡')).toThrow(/⚡/)
  })

  it('rejects charsets shorter than 2 characters', () => {
    expect(() => asciiShapeShader(4, '@')).toThrow()
    expect(() => asciiShapeShader(4, '')).toThrow()
  })
})
