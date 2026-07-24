import { DEFAULT_ASCII_CHARSET, DEFAULT_ASCII_RAMP } from '@vue-termui/three'

// Glyph charsets for SuperSampleType.ASCII demos. The 'ramp' style reads them
// darkest to brightest; the 'shape' style treats them as an unordered pool.

// brightest-to-darkest source reversed into ramp order (darkest first)
const detailedRamp = [...'$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ']
  .reverse()
  .join('')

export const asciiRamps = [
  // every printable ASCII char; unordered, so only useful with 'shape'
  { name: 'full', chars: DEFAULT_ASCII_CHARSET },
  { name: 'classic', chars: DEFAULT_ASCII_RAMP },
  { name: 'detailed', chars: detailedRamp },
  // braille dot count doubles as pixel density: 0 dots → 8 dots
  { name: 'braille', chars: ' ⠁⠃⠇⡇⣇⣧⣷⣿' },
  { name: 'blocks', chars: ' ░▒▓█' },
] as const

export type AsciiRampName = (typeof asciiRamps)[number]['name']
