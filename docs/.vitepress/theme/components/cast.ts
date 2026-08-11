// asciinema v3 cast parser: https://docs.asciinema.org/manual/asciicast/v3/
// A cast is newline-delimited JSON: the first line is a header object, every
// following line an event tuple `[interval, code, data]` where `interval` is the
// seconds elapsed since the previous event. We accumulate those into absolute
// times and keep only the `"o"` (output) events playback needs.

export interface CastHeader {
  /** Terminal grid, from the header's `term`. */
  cols: number
  rows: number
  title?: string
}

export interface CastEvent {
  /** Seconds since the recording started, accumulated from the event intervals. */
  time: number
  data: string
}

export interface Cast {
  header: CastHeader
  events: CastEvent[]
  /** Timestamp of the last event, in seconds. */
  duration: number
}

interface RawHeader {
  version?: number
  title?: string
  term?: { cols?: number; rows?: number }
}

export function parseCast(text: string): Cast {
  const lines = text
    .split('\n')
    // `#`-prefixed lines are comments; blank ones are noise.
    .filter((line) => line.trim().length > 0 && !line.startsWith('#'))
  const headerLine = lines[0]
  if (!headerLine) throw new Error('Empty cast: missing header line')

  const raw = JSON.parse(headerLine) as RawHeader
  if (raw.version !== 3) {
    throw new Error(
      `Unsupported asciicast version ${raw.version}: record with asciinema 3, which writes v3 by default.`,
    )
  }

  const events: CastEvent[] = []
  // Intervals are relative to the previous event, so the clock advances over
  // *every* event (input, resize, marker…) even though only output is kept.
  let clock = 0
  for (const line of lines.slice(1)) {
    const [interval, code, data] = JSON.parse(line) as [number, string, string]
    clock += interval
    if (code === 'o') events.push({ time: clock, data })
  }

  return {
    header: { cols: raw.term?.cols ?? 0, rows: raw.term?.rows ?? 0, title: raw.title },
    events,
    duration: events.length > 0 ? events[events.length - 1]!.time : 0,
  }
}
