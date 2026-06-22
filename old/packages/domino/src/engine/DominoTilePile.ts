import { DominoTile } from './DominoTile'
import { shuffle } from './utils/shuffle'
// import { shuffle } from 'lodash-es'

export class DominoTilePile {
  tiles: DominoTile[] = []

  constructor() {
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        this.tiles.push(new DominoTile(i, j))
      }
    }
  }

  shuffle() {
    shuffle(this.tiles)
  }

  toString() {
    return this.size()
      ? Array.from({ length: this.size() })
          .map(() => '🁢')
          .join('')
      : '<Empty>'
  }

  size() {
    return this.tiles.length
  }

  pull(): DominoTile
  pull(n: number): DominoTile[]
  pull(n = 1): DominoTile[] | DominoTile {
    if (this.size() < n) {
      throw new Error(
        `Tile Stack only has ${this.size()} tiles left and cannot be drawn ${n} tiles from.`
      )
    }

    return n < 2 ? this.tiles.shift()! : this.tiles.splice(0, n)
  }
}
