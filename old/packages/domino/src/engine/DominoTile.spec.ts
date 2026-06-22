import { DominoTile, DominoTileDirection } from './DominoTile'

describe('DominoTile', () => {
  it('can be turned', () => {
    const tile = new DominoTile(0, 2)
    expect(tile.value).toBe('0:2')
    expect(tile.turn().value).toBe('2:0')
    expect(tile.value).toBe('2:0')
  })

  it('can be cloned', () => {
    const tile = new DominoTile(0, 2)
    const cloned = tile.clone(DominoTileDirection.vertical)
    tile.turn()
    expect(cloned.value).not.toBe(tile.value)
  })

  it('can get parts', () => {
    const tile = new DominoTile(0, 2)
    expect(tile.start).toBe(0)
    expect(tile.end).toBe(2)
  })

  it('can be stringified', () => {
    const tile = new DominoTile(0, 2).clone(DominoTileDirection.horizontal)
    expect(`${tile}`).toBe('🀳')
    tile.turn()
    expect(`${tile}`).toBe('🀿')
    const clone = tile.clone(DominoTileDirection.vertical)
    expect(`${clone}`).toBe('🁱')
    clone.turn()
    expect(`${clone}`).toBe('🁥')
  })

  it('can be created from string', () => {
    function testString(domino: string) {
      expect(DominoTile.fromString(domino).toString()).toBe(domino)
    }
    testString('🀳')
    testString('🀱')
    testString('🀹')
    testString('🀼')
    testString('🁋')
    testString('🁛')

    testString('🁣')
    testString('🁲')
    testString('🂓')
    testString('🂍')
    testString('🁿')
    testString('🁻')
  })
})
