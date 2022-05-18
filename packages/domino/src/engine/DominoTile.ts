export type DominoHalfTileValueNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type DominoHalfTileValue =
  | `${DominoHalfTileValueNumber}`
  | DominoHalfTileValueNumber
export type DominoTileValue = `${DominoHalfTileValue}:${DominoHalfTileValue}`
export enum DominoTileDirection {
  horizontal,
  vertical,
}

export class DominoTile {
  start: DominoHalfTileValueNumber // actually 1 - 6
  end: DominoHalfTileValueNumber // actually 1 - 6
  direction: DominoTileDirection = DominoTileDirection.vertical

  constructor(start: number, end: number) {
    if (start < 0 || start > 6 || end < 0 || end > 6) {
      throw new Error(`Invalid values ${start} / ${end}.`)
    }
    this.start = start as DominoHalfTileValueNumber
    this.end = end as DominoHalfTileValueNumber
  }

  get value() {
    return `${this.start}:${this.end}`
  }

  get points() {
    return this.start + this.end
  }

  is(tile: DominoTile): boolean
  is(tileStart: number, tileEnd: number): boolean
  is(tileOrStart: DominoTile | number, tileEnd?: number): boolean {
    const start =
      typeof tileOrStart === 'number' ? tileOrStart : tileOrStart.start
    const end = typeof tileOrStart === 'number' ? tileEnd : tileOrStart.end
    return (
      (this.start === start && this.end === end) ||
      (this.end === start && this.start === end)
    )
  }

  isDouble() {
    return this.start === this.end
  }

  turn() {
    const start = this.start
    this.start = this.end
    this.end = start
    return this
  }

  rotate(direction: DominoTileDirection) {
    this.direction = direction
    return this
  }

  clone(direction: DominoTileDirection) {
    const tile = new DominoTile(this.start, this.end)
    tile.direction = direction
    return tile
  }

  toString() {
    return String.fromCodePoint(
      (this.direction === DominoTileDirection.vertical ? 0x1f063 : 0x1f031) +
        this.start * 7 +
        this.end
    )
  }

  /**
   * Creates a DominoTile from a unicode domino string.
   *
   * @param domino A domino unicode string like 🀵 🂃 🁒 🁀 🀼 🁏 🁅 🂓 🁠 🂋 🁕 🀸 🀳 🁄
   */
  static fromString(domino: string): DominoTile {
    const code = domino.codePointAt(0)
    if (code == null) {
      throw new Error(`Cannot create DominoTile from "${domino}".`)
    }

    let direction: DominoTileDirection
    let offset: number
    if (code >= DOMINO_VERTICAL_CODE && code <= DOMINO_VERTICAL_CODE_END) {
      direction = DominoTileDirection.vertical
      offset = code - DOMINO_VERTICAL_CODE
    } else if (
      code >= DOMINO_HORIZONTAL_CODE &&
      code <= DOMINO_HORIZONTAL_CODE_END
    ) {
      direction = DominoTileDirection.horizontal
      offset = code - DOMINO_HORIZONTAL_CODE
    } else {
      throw new Error(`Cannot create DominoTile from "${domino}".`)
    }

    const start = Math.floor(offset / 7)
    const end = Math.floor(offset % 7)
    const tile = new DominoTile(start as any, end as any)
    tile.rotate(direction)
    return tile
  }
}

const DOMINO_HORIZONTAL_CODE = 0x1f031
const DOMINO_HORIZONTAL_CODE_END = 0x1f061
const DOMINO_VERTICAL_CODE = 0x1f063
const DOMINO_VERTICAL_CODE_END = 0x1f093

// const DOMINO_TILE_H_0_0 = '\u{1f031}' // 🀱
// const DOMINO_TILE_V_0_0 = '\u{1f063}' // 🁣
