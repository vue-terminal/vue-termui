// Frame data for the vue-termui logo assemble animation: the 4 isometric
// cubes forming the ⊥ fly in from the corners, fuse, then the labels type in.
// Pure data module (no @opentui/core imports) so frames can be previewed with
// plain node: `node playground/scripts/preview-logo-frames.ts`

export interface Seg {
  text: string
  color?: string
  bold?: boolean
}

/** One rendered frame: HEIGHT lines of styled segments, each WIDTH chars wide. */
export type Frame = Seg[][]

export const GREEN = '#42b883'
export const PINK = '#ff6af0'
export const WHITE = '#ffffff'

// interior of the 20×8 double-border box with paddingX 1
export const WIDTH = 16
export const HEIGHT = 6

const COLORS: Record<string, string> = { g: GREEN, p: PINK, w: WHITE }

interface Art {
  chars: string[]
  // per-cell color key (g/p/w); spaces in `chars` are transparent
  colors: string[]
}

const CUBE: Art = {
  chars: [' ___', '/\\__\\', '\\/__/'],
  colors: [' ppp', 'gpppp', 'ggggg'],
}

// the fused shape — also what the cube sprites composite to at their final
// positions, thanks to the back-top-edge underlay in stamp()
const MERGED: Art = {
  chars: [' _________', '/\\__\\__\\__\\', '\\/__/\\__\\_/', '    \\/__/'],
  colors: [' ppppppppp', 'gpppppppppp', 'gggggppppgg', '    ggggg'],
}

const FLASH: Art = {
  chars: MERGED.chars,
  colors: MERGED.colors.map((row) => row.replace(/[gp]/g, 'w')),
}

interface Cube {
  start: [row: number, col: number]
  /** Detour waypoint hit at the given fraction of the eased progress. */
  via?: [row: number, col: number, at: number]
  end: [row: number, col: number]
  delay: number
}

// listed back-to-front (later cubes draw on top while flying)
const CUBES: Cube[] = [
  { start: [-4, 12], end: [0, 6], delay: 4 }, // right, from top-right
  // middle, from top-left: swings one block right of its slot, then descends,
  // so it never hovers right on top of the left cube
  { start: [-4, -6], via: [-1, 3, 0.75], end: [0, 3], delay: 2 },
  { start: [6, 12], end: [1, 4], delay: 6 }, // bottom stem, from bottom-right
  { start: [6, -6], end: [0, 0], delay: 0 }, // left, from bottom-left
]

const STEPS_PER_CUBE = 12
const BLINKS = 3
const LABEL_CHARS_PER_FRAME = 2
const HOLD_BEFORE_SHINE = 4

const LABELS = ['[V]ue', '[T]ermUI']

type Cell = { ch: string; color?: string; bold?: boolean }
type Grid = (Cell | undefined)[][]

function emptyGrid(): Grid {
  return Array.from({ length: HEIGHT }, () => Array.from({ length: WIDTH }, () => undefined))
}

interface StampOptions {
  bold?: boolean
  /**
   * Number of leading art rows that only draw on empty cells. A cube's
   * back-top edge (` ___`) is its farthest part: anything already drawn is in
   * front of it, so it must not erase other cubes' edges when tucking under.
   */
  backRows?: number
}

function stamp(grid: Grid, art: Art, row0: number, col0: number, opts: StampOptions = {}) {
  for (const [r, rowChars] of art.chars.entries()) {
    const rowColors = art.colors[r]!
    const behind = r < (opts.backRows ?? 0)
    for (let c = 0; c < rowChars.length; c++) {
      const ch = rowChars[c]!
      if (ch === ' ') continue
      const row = row0 + r
      const col = col0 + c
      if (row < 0 || row >= HEIGHT || col < 0 || col >= WIDTH) continue
      if (behind && grid[row]![col]) continue
      const cell: Cell = { ch, color: COLORS[rowColors[c]!]! }
      if (opts.bold) cell.bold = true
      grid[row]![col] = cell
    }
  }
}

function stampLabels(grid: Grid, revealedChars: number) {
  for (const [i, label] of LABELS.entries()) {
    const text = label.slice(0, revealedChars)
    const art: Art = {
      chars: [text],
      // the letter inside the brackets is green, the rest white
      colors: [text.replace(/./g, (_, j: number) => (j === 1 ? 'g' : 'w'))],
    }
    stamp(grid, art, HEIGHT - LABELS.length + i, WIDTH - label.length, { bold: true })
  }
}

function gridToFrame(grid: Grid): Frame {
  return grid.map((row) => {
    const segs: Seg[] = []
    for (const cell of row) {
      const ch = cell?.ch ?? ' '
      const last = segs.at(-1)
      if (last && last.color === cell?.color && last.bold === cell?.bold) {
        last.text += ch
      } else {
        const seg: Seg = { text: ch }
        if (cell?.color) seg.color = cell.color
        if (cell?.bold) seg.bold = true
        segs.push(seg)
      }
    }
    return segs
  })
}

function easeOutQuad(t: number) {
  return 1 - (1 - t) ** 2
}

function mergedFrame(art: Art, revealedLabelChars: number, shineCol = -1): Frame {
  const grid = emptyGrid()
  stamp(grid, art, 0, 0)
  stampLabels(grid, revealedLabelChars)
  // diagonal glint: each label row shines one column behind the row above
  for (const [i, row] of [HEIGHT - 2, HEIGHT - 1].entries()) {
    const cell = grid[row]?.[shineCol - i]
    if (shineCol >= 0 && cell) cell.color = PINK
  }
  return gridToFrame(grid)
}

export function buildFrames(): Frame[] {
  const frames: Frame[] = []
  const totalSteps = Math.max(...CUBES.map((cube) => cube.delay)) + STEPS_PER_CUBE

  for (let step = 0; step <= totalSteps; step++) {
    const grid = emptyGrid()
    for (const { start, via, end, delay } of CUBES) {
      const t = Math.min(Math.max((step - delay) / STEPS_PER_CUBE, 0), 1)
      let p = easeOutQuad(t)
      let [from, to] = [start, end]
      if (via) {
        const [viaRow, viaCol, at] = via
        if (p < at) {
          ;[to, p] = [[viaRow, viaCol], p / at]
        } else {
          ;[from, p] = [[viaRow, viaCol], (p - at) / (1 - at)]
        }
      }
      stamp(
        grid,
        CUBE,
        Math.round(from[0] + (to[0] - from[0]) * p),
        Math.round(from[1] + (to[1] - from[1]) * p),
        { backRows: 1 },
      )
    }
    const frame = gridToFrame(grid)
    // skip steps where cell rounding produced no visible change
    if (frames.length === 0 || JSON.stringify(frame) !== JSON.stringify(frames.at(-1))) {
      frames.push(frame)
    }
  }

  // the assembled ⊥ blinks before the labels type in
  for (let i = 0; i < BLINKS; i++) {
    frames.push(mergedFrame(FLASH, 0))
    frames.push(mergedFrame(MERGED, 0))
  }

  const maxLabel = Math.max(...LABELS.map((label) => label.length))
  for (
    let revealed = LABEL_CHARS_PER_FRAME;
    revealed < maxLabel + LABEL_CHARS_PER_FRAME;
    revealed += LABEL_CHARS_PER_FRAME
  ) {
    frames.push(mergedFrame(MERGED, Math.min(revealed, maxLabel)))
  }

  // hold, then a glint sweeps diagonally across the labels
  for (let i = 0; i < HOLD_BEFORE_SHINE; i++) {
    frames.push(mergedFrame(MERGED, maxLabel))
  }
  const labelStart = WIDTH - maxLabel
  for (let col = labelStart + 1; col <= WIDTH; col++) {
    frames.push(mergedFrame(MERGED, maxLabel, col))
  }
  frames.push(mergedFrame(MERGED, maxLabel))

  return frames
}
