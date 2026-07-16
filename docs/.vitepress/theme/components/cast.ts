// asciinema cast parser, supporting both v2 and v3. A cast is newline-delimited
// JSON: the first line is a header object, every following line is an event
// tuple `[time, code, data]`. We normalize both versions to absolute-time `"o"`
// (output) events for playback.
//
// v2: https://docs.asciinema.org/manual/asciicast/v2/  — absolute timestamps,
//     grid as top-level `width`/`height`.
// v3: https://docs.asciinema.org/manual/asciicast/v3/  — event times are
//     intervals since the previous event, grid nested under `term`.

export interface CastHeader {
  version: number
  width: number
  height: number
  title?: string
}

export interface CastEvent {
  /** Seconds since the recording started (absolute, normalized from v3 deltas). */
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
  width?: number
  height?: number
  title?: string
  term?: { cols?: number; rows?: number }
}

export function parseCast(text: string): Cast {
  const lines = text.split('\n').filter((line) => line.trim().length > 0)
  const headerLine = lines[0]
  if (!headerLine) throw new Error('Empty cast: missing header line')

  const raw = JSON.parse(headerLine) as RawHeader
  const version = raw.version ?? 2
  // v3 nests the grid under `term`; v2 keeps it top-level.
  const width = (version >= 3 ? raw.term?.cols : raw.width) ?? 0
  const height = (version >= 3 ? raw.term?.rows : raw.height) ?? 0

  const events: CastEvent[] = []
  // v3 times are intervals since the previous event, so accumulate over *every*
  // event (including input/resize/marker); v2 times are already absolute.
  let clock = 0
  for (const line of lines.slice(1)) {
    const [time, code, data] = JSON.parse(line) as [number, string, string]
    clock = version >= 3 ? clock + time : time
    if (code === 'o') events.push({ time: clock, data })
  }

  return {
    header: { version, width, height, title: raw.title },
    events,
    duration: events.length > 0 ? events[events.length - 1]!.time : 0,
  }
}
