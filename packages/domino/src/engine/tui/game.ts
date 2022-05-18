import { DominoGame, DominoTile } from '../'

async function main() {
  const game = new DominoGame('Eduardo', 'Marie', 'Véronique', 'Pierre')

  // game.on('*', (type, event) => {
  //   if (type === 'playerSkip') {
  // FIXME: event not discriminated?
  // console.log(`skip: ${event}`)
  // }
  // console.log(`${type}: ${event}`)
  // })

  console.log(`${game}`)
  game.play(new DominoTile(6, 6))
  console.log(`${game}`)

  while (!game.isOver()) {
    const possibleTiles = game.getPossibleTiles()
    const i = Math.floor(Math.random() * possibleTiles.length)
    game.play(possibleTiles[i])
    console.log(`${game}`)
  }

  const winner = game.getWinner()
  if (winner) {
    console.log(`${winner.name} won ${game.getWinnerPoints()} points!`)
  }
}

main()
