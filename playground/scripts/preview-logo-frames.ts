// Prints every frame of the logo assemble animation.
// Usage: node playground/scripts/preview-logo-frames.ts [--color]
import { buildFrames, WIDTH } from '../src/components/logo-frames.ts'

const color = process.argv.includes('--color')

function hexToAnsi(hex: string, bold?: boolean) {
  const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
  return `\x1B[${bold ? '1;' : ''}38;2;${r};${g};${b}m`
}

const frames = buildFrames()
frames.forEach((frame, i) => {
  console.log(`frame ${i}`)
  console.log(`┌${'─'.repeat(WIDTH)}┐`)
  for (const line of frame) {
    const text = line
      .map((seg) =>
        color && seg.color ? `${hexToAnsi(seg.color, seg.bold)}${seg.text}\x1B[0m` : seg.text,
      )
      .join('')
    console.log(`│${text}│`)
  }
  console.log(`└${'─'.repeat(WIDTH)}┘`)
})
