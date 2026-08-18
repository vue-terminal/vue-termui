<script setup lang="ts">
// Every kind of image source `<Image>` accepts, side by side: files of each
// format (PNG with alpha, JPEG, WebP, GIF), a `data:` URL, pixels generated at
// runtime, a remote URL, and a path that doesn't exist (the error path).
// `n` walks the sources, `f` cycles the `fit` mode, `p` the drawing protocol.
import {
  Box,
  computed,
  Image,
  ImageLoadError,
  NativeImage,
  nextTick,
  onKeyDown,
  onUnmounted,
  ref,
  Select,
  Text,
  useTemplateRef,
  watch,
} from 'vue-termui'
import type { ImageFit, ImageProtocol, ImageSource, SelectOption } from 'vue-termui'

// Reads from src/assets in dev; in a build Vite rewrites this to the emitted
// dist/assets file (https://vite.dev/guide/assets#new-url-url-import-meta-url).
function imageUrl(name: string): URL {
  return new URL(`../assets/images/${name}`, import.meta.url)
}

// An 8×8 checkerboard. The format is sniffed from the decoded bytes, so a
// `data:` URL needs no extension to go by.
const CHECKER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAFUlEQVQI12OcOXMmAzbAxIADDE4JAGoZAdtxHVhPAAAAAElFTkSuQmCC'

// Pixels built in memory: `source` also takes an already decoded `NativeImage`,
// so an app can generate its images (or resize/crop/composite loaded ones).
// Built on first use — decoding needs the native library, which is only up once
// the app is running.
let generated: NativeImage | null = null
function generatedImage(): NativeImage {
  if (generated) return generated
  const size = 96
  const pixels = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      pixels[i] = Math.round((x / size) * 255)
      pixels[i + 1] = Math.round((y / size) * 255)
      pixels[i + 2] = 180
      pixels[i + 3] = 255
    }
  }
  generated = NativeImage.fromRgba(pixels, size, size)
  return generated
}

// Ours to release: the renderable retains its own handle on the images it draws.
onUnmounted(() => {
  generated?.dispose()
  generated = null
})

interface ImageEntry extends SelectOption {
  /** Resolved on demand so the generated image is only built once shown. */
  get: () => ImageSource | NativeImage
}

const entries: ImageEntry[] = [
  { name: 'PNG', description: 'logo.png · 192×192, alpha', get: () => imageUrl('logo.png') },
  { name: 'JPEG', description: 'photo.jpg · 320×200', get: () => imageUrl('photo.jpg') },
  { name: 'WebP', description: 'gradient.webp · 240×160', get: () => imageUrl('gradient.webp') },
  { name: 'GIF', description: 'spin.gif · first frame only', get: () => imageUrl('spin.gif') },
  { name: 'data: URL', description: 'inline bytes · 8×8', get: () => CHECKER },
  { name: 'Generated', description: 'NativeImage.fromRgba · 96×96', get: () => generatedImage() },
  {
    name: 'Remote',
    description: 'https://… · needs network',
    get: () => 'https://picsum.photos/id/1025/320/200',
  },
  { name: 'Missing file', description: 'triggers @error', get: () => './nope.png' },
]

const index = ref(0)
const source = computed(() => entries[index.value]!.get())

const fits: ImageFit[] = ['fit', 'cover', 'fill']
const fit = ref<ImageFit>('fit')

const protocols: ImageProtocol[] = ['auto', 'kitty', 'sixel', 'blocks']
const protocol = ref<ImageProtocol>('auto')

const status = ref('loading…')
const failed = ref(false)

const preview = useTemplateRef('preview')
// Which protocol `auto` (or an unsupported request) actually resolves to here.
const effective = ref('')
function readEffective(): void {
  effective.value = preview.value?.$el.effectiveProtocol ?? ''
}

watch([source, protocol], async () => {
  status.value = 'loading…'
  failed.value = false
  await nextTick()
  readEffective()
})

function onLoad(image: NativeImage): void {
  status.value = `${image.width}×${image.height}`
  failed.value = false
  readEffective()
}

function onError(error: unknown): void {
  failed.value = true
  status.value = error instanceof ImageLoadError ? `${error.code}: ${error.message}` : String(error)
}

onKeyDown((key) => {
  if (key.name === 'n') {
    // The Select only sees ↑/↓ while it is focused; `n` works from anywhere.
    index.value = (index.value + 1) % entries.length
  } else if (key.name === 'f') {
    fit.value = fits[(fits.indexOf(fit.value) + 1) % fits.length]!
  } else if (key.name === 'p') {
    protocol.value = protocols[(protocols.indexOf(protocol.value) + 1) % protocols.length]!
  }
})
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Text bold fg="#42b883">Image</Text>
    <Text fg="#888888">↑/↓ or n source · f fit ({{ fit }}) · p protocol ({{ protocol }})</Text>

    <Box flexDirection="row" :gap="1" :flexShrink="0">
      <!-- Autofocus so ↑/↓ drive the list; Esc returns focus to the sidebar.
           Descriptions go to the status line so all eight entries fit. -->
      <Select
        v-model="index"
        :options="entries"
        :showDescription="false"
        autofocus
        width="30%"
        :height="8"
      />

      <Box
        :flexGrow="1"
        :height="10"
        borderStyle="rounded"
        :borderColor="failed ? '#ff5555' : '#444444'"
        title=" preview "
        titleColor="#888888"
      >
        <!-- A renderable has no intrinsic size: without a width/height (or a
             flex rule) an Image paints nothing. -->
        <Image
          ref="preview"
          :source="source"
          :fit="fit"
          :protocol="protocol"
          width="100%"
          :flexGrow="1"
          @load="onLoad"
          @error="onError"
        />
      </Box>
    </Box>

    <Box flexDirection="column" :flexShrink="0">
      <Box flexDirection="row" :gap="1">
        <Text fg="#888888">{{ entries[index]!.name }}:</Text>
        <Text :fg="failed ? '#ff5555' : '#42b883'">{{ status }}</Text>
        <Text fg="#666666">· drawn with {{ effective || '…' }}</Text>
      </Box>
      <Text fg="#666666">{{ entries[index]!.description }}</Text>
    </Box>

    <!-- The same source in all three fit modes. Non-overlapping images may use
         different protocols, so these can each resolve on their own. -->
    <Box flexDirection="row" :gap="2" :flexShrink="0">
      <Box v-for="mode in fits" :key="mode" flexDirection="column">
        <Text :fg="mode === fit ? '#42b883' : '#666666'">{{ mode }}</Text>
        <Image :source="source" :fit="mode" :protocol="protocol" :width="16" :height="5" />
      </Box>
    </Box>
  </Box>
</template>
