import { DEFAULT_ASCII_RAMP } from '@vue-termui/three'

// Glyph ramps for SuperSampleType.ASCII demos, darkest to brightest.

// brightest-to-darkest source reversed into ramp order (darkest first)
const detailedRamp = [...'$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ']
  .reverse()
  .join('')

export const asciiRamps = [
  { name: 'classic', chars: DEFAULT_ASCII_RAMP },
  { name: 'detailed', chars: detailedRamp },
  // braille dot count doubles as pixel density: 0 dots → 8 dots
  { name: 'braille', chars: ' ⠁⠃⠇⡇⣇⣧⣷⣿' },
  { name: 'blocks', chars: ' ░▒▓█' },
] as const

export type AsciiRampName = (typeof asciiRamps)[number]['name']
