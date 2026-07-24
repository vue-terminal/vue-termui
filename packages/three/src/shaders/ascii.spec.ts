import { describe, expect, it } from 'vitest'
import { asciiShader, DEFAULT_ASCII_RAMP } from './ascii'

describe('asciiShader', () => {
  it('embeds the ramp codepoints in order', () => {
    const code = asciiShader(4, ' .@')
    expect(code).toContain('array<u32, 3>(32u, 46u, 64u)')
  })

  it('supports characters outside the BMP as single ramp entries', () => {
    const code = asciiShader(4, ' 🬗')
    expect(code).toContain(`array<u32, 2>(32u, ${0x01_fb_17}u)`)
  })

  it('interpolates the workgroup size', () => {
    expect(asciiShader(8, DEFAULT_ASCII_RAMP)).toContain('@workgroup_size(8, 8, 1)')
  })

  it('rejects ramps shorter than 2 characters', () => {
    expect(() => asciiShader(4, '@')).toThrow()
    expect(() => asciiShader(4, '')).toThrow()
  })
})
