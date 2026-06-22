import { DominoTilePile } from './DominoTilePile'

describe('DominoTileStack', () => {
  it('has all tiles', () => {
    const pile = new DominoTilePile()

    expect(pile.tiles.join('')).toBe('🁣🁤🁥🁦🁧🁨🁩🁫🁬🁭🁮🁯🁰🁳🁴🁵🁶🁷🁻🁼🁽🁾🂃🂄🂅🂋🂌🂓')
    expect(pile.tiles).toHaveLength(28)
  })

  it('can pull pieces', () => {
    const pile = new DominoTilePile()

    expect(pile.pull().toString()).toBe('🁣')
    expect(pile.tiles).toHaveLength(27)

    expect(pile.pull(2).join('')).toBe('🁤🁥')
    expect(pile.tiles).toHaveLength(25)

    expect(pile.tiles.join('')).toEqual(`🁦🁧🁨🁩🁫🁬🁭🁮🁯🁰🁳🁴🁵🁶🁷🁻🁼🁽🁾🂃🂄🂅🂋🂌🂓`)
  })

  it('can be shuffled', () => {
    const pile = new DominoTilePile()
    pile.shuffle()

    expect(pile.tiles.join('')).not.toBe(`🁣🁤🁥🁦🁧🁨🁩🁫🁬🁭🁮🁯🁰🁳🁴🁵🁶🁷🁻🁼🁽🁾🂃🂄🂅🂋🂌🂓`)
    expect(pile.tiles).toHaveLength(28)
  })
})
