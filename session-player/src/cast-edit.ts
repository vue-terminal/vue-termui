// Editing transforms for recorded casts. These are session-player concerns: the
// reusable player (from @vue-termui/docs) only *plays* a cast — the wrapper owns
// the content and mutates it here, then feeds the result back to the player.
import type { Cast, CastEvent } from '@vue-termui/docs/cast'

/**
 * Cut a cast down to the `[start, end]` window (both in seconds) and rebase time
 * so playback begins at 0.
 *
 * A terminal is a stateful VT parser: everything drawn before `start` (colors,
 * cursor moves, content) establishes the picture you'd see at the trim-in point.
 * Simply dropping those events would replay from a blank screen. So we squash all
 * pre-`start` output into a single event at t=0, reproducing that state, then keep
 * the in-window events at their original pacing (`time - start`).
 */
export function trimCast(cast: Cast, start: number, end: number): Cast {
  const from = Math.max(0, Math.min(start, cast.duration))
  const to = Math.max(from, Math.min(end, cast.duration))

  const prefix: string[] = []
  const kept: CastEvent[] = []
  for (const event of cast.events) {
    if (event.time < from) prefix.push(event.data)
    else if (event.time <= to) kept.push({ time: event.time - from, data: event.data })
  }
  if (prefix.length > 0) kept.unshift({ time: 0, data: prefix.join('') })

  return {
    header: { ...cast.header },
    events: kept,
    duration: to - from,
  }
}

/** Return a copy of the cast with a different terminal grid. */
export function resizeCast(cast: Cast, cols: number, rows: number): Cast {
  return {
    header: { ...cast.header, cols, rows },
    events: cast.events.map((event) => ({ ...event })),
    duration: cast.duration,
  }
}

/**
 * Serialize a cast back to asciicast v3 text (the inverse of `parseCast`). Only
 * the normalized fields survive a parse→serialize round-trip: the header carries
 * the grid and title, and every event becomes an `"o"` tuple timed as the interval
 * since the previous one.
 */
export function serializeCast(cast: Cast): string {
  const header: { version: number; term: { cols: number; rows: number }; title?: string } = {
    version: 3,
    term: { cols: cast.header.cols, rows: cast.header.rows },
  }
  if (cast.header.title != null) header.title = cast.header.title

  const lines = [JSON.stringify(header)]
  let previous = 0
  for (const event of cast.events) {
    // Rounded to microseconds to keep float noise out of the file.
    const interval = Math.round((event.time - previous) * 1e6) / 1e6
    lines.push(JSON.stringify([interval, 'o', event.data]))
    previous = event.time
  }
  return lines.join('\n') + '\n'
}
