import { DominoTile, DominoTileDirection } from './DominoTile'

export class DominoTileBoard {
  tiles: DominoTile[] = []
  center: number = 0
  width: number = Infinity

  toString() {
    return this.tiles.length ? this.tiles.join(' ') : '<Empty>'
  }

  placeTile(tile: DominoTile, position?: DominoTileBoardPosition): void {
    tile.rotate(
      tile.isDouble()
        ? DominoTileDirection.vertical
        : DominoTileDirection.horizontal
    )

    if (!this.tiles.length) {
      // we are placing the first tile
      this.tiles.push(tile)
      return
    }

    const possiblePosition = this.canPlaceTile(tile)
    if (position ? !(possiblePosition & position) : !possiblePosition) {
      throw new Error(`Tile ${tile} cannot be placed in that position.`)
    }

    position = position || possiblePosition

    const targetTile =
      position === DominoTileBoardPosition.end
        ? this.tiles[this.tiles.length - 1]
        : this.tiles[0]

    const targetValue =
      position === DominoTileBoardPosition.end
        ? targetTile.end
        : targetTile.start

    if (position === DominoTileBoardPosition.end) {
      if (tile.value.endsWith(`${targetValue}`)) {
        tile.turn()
      }
      this.tiles.push(tile)
    } else {
      if (tile.value.startsWith(`${targetValue}`)) {
        tile.turn()
      }
      // we are moving the center of the board
      this.center++
      this.tiles.unshift(tile)
    }
  }

  canPlaceTile(tile: DominoTile): DominoTileBoardPosition {
    if (!this.tiles.length) {
      return DominoTileBoardPosition.both
    }

    const startTile = this.tiles[0]
    const endTile = this.tiles[this.tiles.length - 1]

    const canOnStart = tile.value.includes(`${startTile.start}`)
    const canOnEnd = tile.value.includes(`${endTile.end}`)

    if (canOnStart) {
      return canOnEnd
        ? DominoTileBoardPosition.both
        : DominoTileBoardPosition.start
    } else {
      return canOnEnd
        ? DominoTileBoardPosition.end
        : DominoTileBoardPosition.none
    }
  }
}

export const enum DominoTileBoardPosition {
  none = 0,
  start = 1,
  end = 2,
  both = start | end,
}
