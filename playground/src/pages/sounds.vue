<script setup lang="ts">
// Soundboard: each key plays a native macOS sound (converted to WAV in
// src/assets/sounds). Audio is the native miniaudio engine from @opentui/core
// — vue-termui doesn't re-export it, so we import it straight from core.
import { Box, onKeyDown, onMounted, onUnmounted, ref, Text } from 'vue-termui'
import { Audio, type AudioSound } from '@opentui/core'
import { loadAsset } from '../loadAsset'

// Import each sound as a URL (https://vite.dev/guide/assets#importing-asset-as-url).
// Vite emits the file into the build and rewrites the import to the URL that
// points at it; `loadAsset` turns that URL into the on-disk path the audio
// engine needs. Importing explicitly (vs. a dynamic `new URL(..., meta.url)`)
// only bundles the sounds actually referenced here.
import GlassUrl from '../assets/sounds/Glass.wav?url'
import PopUrl from '../assets/sounds/Pop.wav?url'
import TinkUrl from '../assets/sounds/Tink.wav?url'
import SubmarineUrl from '../assets/sounds/Submarine.wav?url'
import FunkUrl from '../assets/sounds/Funk.wav?url'
import HeroUrl from '../assets/sounds/Hero.wav?url'
import PingUrl from '../assets/sounds/Ping.wav?url'
import BottleUrl from '../assets/sounds/Bottle.wav?url'
import FrogUrl from '../assets/sounds/Frog.wav?url'

// key → sound. Pressing the key plays that sound.
const pads = [
  { key: 'a', name: 'Glass', url: GlassUrl },
  { key: 's', name: 'Pop', url: PopUrl },
  { key: 'd', name: 'Tink', url: TinkUrl },
  { key: 'f', name: 'Submarine', url: SubmarineUrl },
  { key: 'g', name: 'Funk', url: FunkUrl },
  { key: 'h', name: 'Hero', url: HeroUrl },
  { key: 'j', name: 'Ping', url: PingUrl },
  { key: 'k', name: 'Bottle', url: BottleUrl },
  { key: 'l', name: 'Frog', url: FrogUrl },
] as const

const status = ref('loading sounds…')
const lastPlayed = ref('')
const activeKey = ref('')

let audio: Audio | null = null
const sounds = new Map<string, AudioSound>()

onMounted(async () => {
  audio = Audio.create({ autoStart: false })
  audio.on('error', (error, context) => {
    status.value = `audio error (${context.action}): ${error.message}`
  })

  if (!audio.start()) {
    status.value = 'no audio output device available'
    return
  }

  const loaded = await Promise.all(
    pads.map(async (pad) => [pad.key, await audio!.loadSoundFile(loadAsset(pad.url))] as const),
  )
  for (const [key, sound] of loaded) {
    if (sound) sounds.set(key, sound)
  }

  status.value = `ready — ${sounds.size}/${pads.length} sounds loaded`
})

onUnmounted(() => {
  audio?.dispose()
  audio = null
  sounds.clear()
})

function playSound(key: string) {
  const pad = pads.find((p) => p.key === key)
  if (!pad || !audio) return

  const sound = sounds.get(pad.key)
  if (!sound) return

  audio.play(sound, { volume: 0.9 })
  lastPlayed.value = pad.name
  activeKey.value = pad.key
}

onKeyDown((event) => {
  playSound(event.name)
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Soundboard 🔊</Text>
    <Text fg="#888888">Press a highlighted key to play a sound.</Text>

    <Box flexDirection="row" :gap="1" flexWrap="wrap">
      <Box
        v-for="pad in pads"
        :key="pad.key"
        flexDirection="column"
        :padding="1"
        borderStyle="rounded"
        :borderColor="activeKey === pad.key ? '#42b883' : '#444444'"
        focusable
        autofocus
        @keyDown="(e) => e.name === 'space' && playSound(pad.key)"
        focusedBorderColor="yellow"
        @mouseDown="playSound(pad.key)"
      >
        <Text bold :fg="activeKey === pad.key ? '#42b883' : '#ffffff'">{{
          pad.key.toUpperCase()
        }}</Text>
        <Text fg="#888888">{{ pad.name }}</Text>
      </Box>
    </Box>

    <Box flexDirection="row">
      <Text>Last played: </Text>
      <Text fg="#42b883">{{ lastPlayed || '—' }}</Text>
    </Box>
    <Text fg="#666666">{{ status }}</Text>
  </Box>
</template>
