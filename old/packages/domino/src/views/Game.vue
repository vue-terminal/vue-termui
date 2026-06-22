<script setup lang="ts">
import { DominoGame, DominoTile, DominoTilePile, Player } from '../engine'
import { shallowRef, triggerRef } from 'vue-termui'
import XDominoTile from '../components/DominoTile.vue'
import HandDominoTile from '../components/HandDominoTile.vue'

const playerList = ['Eduardo', 'Véronique', 'Marie', 'Pierre']
const game = shallowRef(new DominoGame(...playerList))

game.value.play(new DominoTile(6, 6))

const player = computed(() => game.value.players[0])

function asHiddenHand(player: Player) {
  return player.hand.map(() => '🁢').join('')
}

function playTile(tile: DominoTile) {
  const currentPlayerIndex = game.value.nextPlayerIndex
  game.value.play(tile)
  while (
    !game.value.isOver() &&
    game.value.nextPlayerIndex !== currentPlayerIndex
  ) {
    const possibleTiles = game.value.getPossibleTiles()
    const i = Math.floor(Math.random() * possibleTiles.length)
    game.value.play(possibleTiles[i])
  }
}

onKeyData('Enter', () => {
  game.value.playRandomly()
  triggerRef(game)
})

onKeyData(['r', 'R'], (e) => {
  if (e.ctrlKey) {
    game.value.off('boardUpdate')
    game.value = new DominoGame(...playerList)
    game.value.play(new DominoTile(6, 6))
    triggerRef(game)
    game.value.on('boardUpdate', () => {
      triggerRef(game)
    })
  }
})
</script>

<template>
  <Box width="100%">
    <Box
      borderStyle="singleDouble"
      title="Players"
      :width="19"
      flexDirection="column"
    >
      <Text
        v-for="p in game.players"
        :color="player === p ? 'blue' : undefined"
        :bold="game.currentPlayer === p"
      >
        {{ game.currentPlayer === p ? '>' : ' ' }}
        {{ p.name }} ({{ p.hand.length }})
      </Text>
    </Box>
    <Box
      justifyContent="center"
      alignItems="center"
      :flexGrow="1"
      borderStyle="double"
      flexDirection="row"
    >
      <template v-for="tile in game.board.tiles">
        <Text>&nbsp;</Text>
        <XDominoTile :tile="tile" />
      </template>
    </Box>
  </Box>
  <Box width="100%" justifyContent="space-between">
    <Box title="Log" :flexGrow="1" borderStyle="doubleSingle">
      <Text>TODO: logs</Text>
    </Box>
    <Box
      :width="18"
      :title="player.name"
      borderStyle="round"
      :borderColor="game.currentPlayer === player ? 'blueBright' : 'gray'"
      justifyContent="center"
    >
      <HandDominoTile
        v-for="tile in player.hand"
        :tile="tile"
        :disabled="!game.board.canPlaceTile(tile)"
        :bold="!!game.board.canPlaceTile(tile)"
      />
    </Box>
  </Box>
  <Box justifyContent="flex-end" width="100%" borderColor="gray">
    <Text dimmed>[⇥] Select tile</Text>
    <Text dimmed> | </Text>
    <Text dimmed>[↩︎] Play tile</Text>
    <Text dimmed> | </Text>
    <Text dimmed>[^R]estart</Text>
  </Box>
</template>
