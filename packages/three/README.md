# @vue-termui/three

Render [Three.js](https://threejs.org/) WebGPU scenes inside a
[vue-termui](https://github.com/vue-terminal/vue-termui) terminal app.

A port of [`@opentui/three`](https://github.com/anomalyco/opentui) that runs on
Node.js (>= 26.3.0 with `--experimental-ffi`) instead of Bun.

## Usage

```vue
<script setup lang="ts">
import { shallowRef } from 'vue-termui'
import { Three, onFrame } from '@vue-termui/three'
import { Scene, PerspectiveCamera } from 'three'

const scene = new Scene()
const camera = new PerspectiveCamera(45, 1, 0.1, 100)
// build your scene...
</script>

<template>
  <Three :scene="scene" :camera="camera" />
</template>
```
