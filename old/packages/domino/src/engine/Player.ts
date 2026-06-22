import { DominoTile, DominoTileDirection } from './DominoTile'

export class Player {
  name: string
  readonly hand: DominoTile[] = []
  avatar?: string

  constructor(name: string) {
    this.name = name
  }

  addToHand(tiles: DominoTile | DominoTile[]) {
    if (Array.isArray(tiles)) {
      this.hand.push(...tiles)
    } else {
      this.hand.push(tiles)
    }
    // return this
  }

  getHandPoints() {
    return this.hand.reduce((total, tile) => total + tile.points, 0)
  }

  hasTile(tile: DominoTile): boolean
  hasTile(tileStart: number, tileEnd: number): boolean
  hasTile(tileOrStart: DominoTile | number, tileEnd?: number): boolean {
    return this.hand.some((tile) => tile.is(tileOrStart as any, tileEnd as any))
  }

  useTile(tile: DominoTile): DominoTile {
    const index = this.hand.findIndex((t) => t.is(tile))
    if (index < 0) {
      throw new Error(`Player ${this.name} doesn't have ${tile}.`)
    }
    return this.hand.splice(index, 1)[0]
    // return this
  }

  toString() {
    return `${this.name}: ${this.hand
      .map((t) => t.clone(DominoTileDirection.vertical))
      .join('')}`
  }
}
