import { DominoTile } from './DominoTile'
import { DominoTileBoard, DominoTileBoardPosition } from './DominoTileBoard'

describe('DominoTileBoard', () => {
  it('empty', () => {
    const board = new DominoTileBoard()

    expect(board.canPlaceTile(new DominoTile(4, 5))).toBe(
      DominoTileBoardPosition.both
    )
    expect(board.canPlaceTile(new DominoTile(5, 5))).toBe(
      DominoTileBoardPosition.both
    )
  })

  it('left side', () => {
    const tiles = '🁀 🀸 🀳 🁄'.split(' ').map(DominoTile.fromString)
    const board = new DominoTileBoard()
    board.tiles = tiles
    expect(board.canPlaceTile(new DominoTile(2, 0))).toBe(
      DominoTileBoardPosition.start
    )
    expect(board.canPlaceTile(new DominoTile(0, 2))).toBe(
      DominoTileBoardPosition.start
    )
    expect(board.canPlaceTile(new DominoTile(2, 2))).toBe(
      DominoTileBoardPosition.start
    )
  })

  it('right side', () => {
    const tiles = '🁀 🀼 🁏 🁅 🂓 🁠 🂋 🁕 🀸 🀳 🁄'.split(' ').map(DominoTile.fromString)
    const board = new DominoTileBoard()
    board.tiles = tiles
    expect(board.canPlaceTile(new DominoTile(4, 5))).toBe(
      DominoTileBoardPosition.end
    )
    expect(board.canPlaceTile(new DominoTile(5, 4))).toBe(
      DominoTileBoardPosition.end
    )
    expect(board.canPlaceTile(new DominoTile(5, 5))).toBe(
      DominoTileBoardPosition.end
    )
  })

  it('wraps', () => {
    const boardText = '🁝 🁳 🀿 🁣 🀵 🁒 🁚 🁜 🀽 🁖 🁃 🂃 🁎 🀸 🀷 🂓 🁟 🁐 🁇 🁫 🀺 🁂 🁻 🁌'
    const tiles = boardText.split(' ').map(DominoTile.fromString)
    const board = new DominoTileBoard()
    board.tiles = tiles
    // TODO:
    //     expect(board.toString()).toBe(`
    // 🁝 🁳 🀿 🁣 🀵 🁒 🁚 🁜 🀽 🁖 🁃 🂃 🁎 🀸 🀷 🂓 🁟 🁐 🁇 🁫 🀺 🁂 🁻 🁌
    //     `)
  })
})
