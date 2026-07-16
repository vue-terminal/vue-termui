import { describe, expect, it } from 'vitest'
import type { Cast } from '@vue-termui/docs/cast'
import { parseCast } from '@vue-termui/docs/cast'
import { resizeCast, serializeCast, trimCast } from './cast-edit'

function makeCast(): Cast {
  return {
    header: { version: 2, width: 80, height: 24, title: 'demo' },
    events: [
      { time: 0, data: 'a' },
      { time: 1, data: 'b' },
      { time: 2, data: 'c' },
      { time: 3, data: 'd' },
    ],
    duration: 3,
  }
}

describe('trimCast', () => {
  it('keeps only events within [start, end] and rebases time to the start', () => {
    const out = trimCast(makeCast(), 1, 2)
    expect(out.events).toEqual([
      // Everything before `start` is squashed into one t=0 event so the terminal
      // state at the trim-in point is reproduced.
      { time: 0, data: 'a' },
      { time: 0, data: 'b' },
      { time: 1, data: 'c' },
    ])
    expect(out.duration).toBe(1)
  })

  it('preserves the grid and title', () => {
    const out = trimCast(makeCast(), 1, 2)
    expect(out.header).toEqual({ version: 2, width: 80, height: 24, title: 'demo' })
  })

  it('does not prepend an empty prefix when start is 0', () => {
    const out = trimCast(makeCast(), 0, 1)
    expect(out.events).toEqual([
      { time: 0, data: 'a' },
      { time: 1, data: 'b' },
    ])
    expect(out.duration).toBe(1)
  })

  it('clamps an out-of-range window', () => {
    const out = trimCast(makeCast(), -5, 99)
    expect(out.events).toHaveLength(4)
    expect(out.duration).toBe(3)
  })
})

describe('resizeCast', () => {
  it('changes only the grid dimensions', () => {
    const out = resizeCast(makeCast(), 120, 40)
    expect(out.header.width).toBe(120)
    expect(out.header.height).toBe(40)
    expect(out.events).toEqual(makeCast().events)
  })
})

describe('serializeCast', () => {
  it('round-trips through parseCast', () => {
    const cast = makeCast()
    const round = parseCast(serializeCast(cast))
    expect(round.header.width).toBe(80)
    expect(round.header.height).toBe(24)
    expect(round.events).toEqual(cast.events)
    expect(round.duration).toBe(cast.duration)
  })

  it('writes a v2 header on the first line', () => {
    const [headerLine] = serializeCast(makeCast()).split('\n')
    expect(JSON.parse(headerLine!)).toEqual({ version: 2, width: 80, height: 24, title: 'demo' })
  })
})
