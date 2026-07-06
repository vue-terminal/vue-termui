<script setup lang="ts">
// Soundboard: each key plays a native macOS sound (converted to WAV in
// src/assets/sounds). Audio is the native miniaudio engine from @opentui/core
// — vue-termui doesn't re-export it, so we import it straight from core.
import { Box, onKeyDown, onMounted, onUnmounted, ref, Text } from 'vue-termui'
import { Audio, type AudioSound } from '@opentui/core'
import { fileURLToPath } from 'node:url'

// Resolve a sound file on disk. In dev `import.meta.url` is the file:// URL of
// this .vue source, so this reads straight from src/assets. In build Vite
// rewrites the expression: the sounds are emitted to dist/assets and resolved
// relative to the bundle (the vue-termui plugin sets a relative `base`).
function soundPath(file: string): string {
  return fileURLToPath(new URL(`../assets/sounds/${file}`, import.meta.url))
}

// key → sound file (in src/assets/sounds). Pressing the key plays that sound.
const pads = [
  { key: 'a', name: 'Glass', file: 'Glass.wav' },
  { key: 's', name: 'Pop', file: 'Pop.wav' },
  { key: 'd', name: 'Tink', file: 'Tink.wav' },
  { key: 'f', name: 'Submarine', file: 'Submarine.wav' },
  { key: 'g', name: 'Funk', file: 'Funk.wav' },
  { key: 'h', name: 'Hero', file: 'Hero.wav' },
  { key: 'j', name: 'Ping', file: 'Ping.wav' },
  { key: 'k', name: 'Bottle', file: 'Bottle.wav' },
  { key: 'l', name: 'Frog', file: 'Frog.wav' },
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
    pads.map(async (pad) => [pad.key, await audio!.loadSoundFile(soundPath(pad.file))] as const),
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
