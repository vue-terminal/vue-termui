<script setup lang="ts">
// Soundboard: each key plays a native macOS sound (converted to WAV in
// src/assets/sounds). Audio is the native miniaudio engine from @opentui/core
// — vue-termui doesn't re-export it, so we import it straight from core.
import { Box, onKeyDown, onMounted, onUnmounted, ref, Text } from 'vue-termui'
import { Audio, type AudioSound } from '@opentui/core'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

// Resolve a sound file on disk. Under Vite's SSR module runner `import.meta.url`
// is a file:// URL pointing at this .vue file, so we resolve relative to it;
// if that's ever not a file URL, fall back to the project cwd.
function soundPath(file: string): string {
  return import.meta.url.startsWith('file:')
    ? fileURLToPath(new URL(`../assets/sounds/${file}`, import.meta.url))
    : resolve(process.cwd(), 'src/assets/sounds', file)
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

  for (const pad of pads) {
    const sound = await audio.loadSoundFile(soundPath(pad.file))
    if (sound) sounds.set(pad.key, sound)
  }

  status.value = `ready — ${sounds.size}/${pads.length} sounds loaded`
})

onUnmounted(() => {
  audio?.dispose()
  audio = null
  sounds.clear()
})

onKeyDown((event) => {
  const pad = pads.find((p) => p.key === event.name)
  if (!pad || !audio) return

  const sound = sounds.get(pad.key)
  if (!sound) return

  audio.play(sound, { volume: 0.9 })
  lastPlayed.value = pad.name
  activeKey.value = pad.key
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
