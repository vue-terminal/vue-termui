import { DominoHalfTileValue, DominoTile } from './DominoTile'
import { DominoTileBoard } from './DominoTileBoard'
import { DominoTilePile } from './DominoTilePile'
import { EventEmitter } from './Emitter'
import { Player } from './Player'

export type DominoGameEvents = {
  playerSkip: Player
  playerPlay: [Player, DominoTile]
  playerUpdate: Player
  playerLocked: [Player, DominoHalfTileValue]

  boardUpdate: DominoTileBoard

  gameStart?: never
  gameEnd: [Player, number] | []
}

export class DominoGame extends EventEmitter<DominoGameEvents> {
  nextPlayerIndex = 0
  players: Player[] = []
  tilesPile = new DominoTilePile()

  board = new DominoTileBoard()

  constructor(...players: string[]) {
    super()
    this.players = players.map((p) => new Player(p))
    this.nextPlayerIndex = 0
    if (this.players.length > 4 || this.players.length < 2) {
      throw new Error('Can only have between 2 and 4 players.')
    }

    this.tilesPile.shuffle()
    this.players.forEach((player, i) => {
      player.addToHand(this.tilesPile.pull(7))
      this.emit('playerUpdate', player)
      if (player.hasTile(6, 6)) {
        this.nextPlayerIndex = i
      }
    })

    this.emit('boardUpdate', this.board)
  }

  play(tile: DominoTile) {
    if (this.currentPlayer.hasTile(tile) && this.board.canPlaceTile(tile)) {
      const targetTile = this.currentPlayer.useTile(tile)
      this.board.placeTile(targetTile)
      this.emit('playerPlay', [this.currentPlayer, tile])
      this.emit('boardUpdate', this.board)

      if (this.isOver()) {
        if (this.isLocked()) {
          this.emit('playerLocked', [
            this.currentPlayer,
            this.board.tiles[0].start,
          ])
        }
        const winner = this.getWinner()
        this.emit('gameEnd', winner ? [winner, this.getWinnerPoints()] : [])
      } else {
        this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.players.length
        // TODO: draw from pile
        while (!this.getPossibleTiles().length) {
          this.emit('playerSkip', this.currentPlayer)
          this.nextPlayerIndex =
            (this.nextPlayerIndex + 1) % this.players.length
        }
      }
    }
  }

  /**
   * Randomly picks a playable tile for the player and plays it.
   */
  playRandomly() {
    const possibleTiles = this.getPossibleTiles()
    if (!possibleTiles.length) return
    const i = Math.floor(Math.random() * possibleTiles.length)
    this.play(possibleTiles[i])
  }

  isLocked() {
    return this.players.every((p) =>
      p.hand.every((t) => !this.board.canPlaceTile(t))
    )
  }

  isOver() {
    return this.isLocked() || this.players.find((player) => !player.hand.length)
  }

  getWinner(): Player | undefined {
    const isOver = this.isOver()
    if (isOver === true) {
      // TODO: count per pairs or single
      const pair1Points =
        this.players[0].getHandPoints() + this.players[2].getHandPoints()
      const pair2Points =
        this.players[1].getHandPoints() + this.players[3].getHandPoints()

      if (pair1Points === pair2Points) {
        return undefined
      }

      return pair1Points < pair2Points ? this.players[0] : this.players[1]
    }

    // cannot return a boolean because we checked for isLocked()
    return isOver
  }

  getWinnerPoints(): number {
    return Math.floor(
      this.players.reduce(
        (total, player) => total + player.getHandPoints(),
        0
      ) / 10
    )
  }

  get currentPlayer() {
    return this.players[this.nextPlayerIndex]
  }

  getPossibleTiles() {
    return this.currentPlayer.hand.filter((tile) =>
      this.board.canPlaceTile(tile)
    )
  }

  getState() {
    this.board.tiles // per id 0:1 === 1:0 === 1
    this.getPossibleTiles() // per id
    // other players hand size
  }

  toString() {
    return `---
Pile: ${this.tilesPile}
Board: ${this.board}
Next player: ${this.players[this.nextPlayerIndex]}
Possible plays: ${this.getPossibleTiles().join('') || '<None>'}${
      this.isLocked() ? ' ❌ <Locked>' : ''
    }
---
${this.players.join('\n')}`
  }
}
