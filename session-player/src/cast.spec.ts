// The parser itself lives in @vue-termui/docs (the docs own the player); it is
// exercised from here because that package has no test runner of its own.
import { describe, expect, it } from 'vitest'
import { parseCast } from '@vue-termui/docs/cast'

function cast(...entries: unknown[]): string {
  return entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n'
}

describe('parseCast', () => {
  it('reads the grid and title from the header', () => {
    const parsed = parseCast(cast({ version: 3, term: { cols: 120, rows: 40 }, title: 'demo' }))
    expect(parsed.header).toEqual({ cols: 120, rows: 40, title: 'demo' })
  })

  it('accumulates event intervals into absolute times', () => {
    const parsed = parseCast(
      cast(
        { version: 3, term: { cols: 80, rows: 24 } },
        [0.5, 'o', 'a'],
        [0.25, 'o', 'b'],
        [1, 'o', 'c'],
      ),
    )
    expect(parsed.events).toEqual([
      { time: 0.5, data: 'a' },
      { time: 0.75, data: 'b' },
      { time: 1.75, data: 'c' },
    ])
    expect(parsed.duration).toBe(1.75)
  })

  it('drops non-output events but still advances the clock', () => {
    const parsed = parseCast(
      cast(
        { version: 3, term: { cols: 80, rows: 24 } },
        [1, 'i', '\r'],
        [1, 'o', 'a'],
        [1, 'x', '0'],
      ),
    )
    expect(parsed.events).toEqual([{ time: 2, data: 'a' }])
    expect(parsed.duration).toBe(2)
  })

  it('rejects a cast that is not v3', () => {
    expect(() => parseCast(cast({ version: 2, width: 80, height: 24 }, [0.5, 'o', 'a']))).toThrow(
      /v3/,
    )
  })

  it('rejects a cast without a header', () => {
    expect(() => parseCast('')).toThrow()
  })
})
