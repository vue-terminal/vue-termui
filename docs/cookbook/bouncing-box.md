# A Bouncing Box

Animation in the terminal is just reactive state updated on a timer. This recipe bounces a box around the screen, reacting to the live terminal size — combining `useInterval`, `useTerminalSize` and absolute positioning.

```vue
<script setup lang="ts">
import {
  Box,
  Text,
  useExit,
  useInterval,
  useTerminalSize,
  onKeyDown,
  computed,
  reactive,
  ref,
} from 'vue-termui'

const exit = useExit()
onKeyDown((key) => {
  if (key.name === 'q') exit()
})

// Reactive terminal size — recomputes the bounds on resize.
const { width: cols, height: rows } = useTerminalSize()

// Box size, proportional to the terminal but never tiny.
const boxWidth = computed(() => Math.max(16, Math.round(cols.value * 0.3)))
const boxHeight = computed(() => Math.max(9, Math.round(rows.value * 0.3)))

// Position + velocity in cells (floats for smooth motion).
const pos = reactive({ x: 2, y: 1 })
const vel = { x: 0.7, y: 0.4 }
const left = computed(() => Math.round(pos.x))
const top = computed(() => Math.round(pos.y))

const seconds = ref(0)
useInterval(() => seconds.value++, 1000)

// ~30 fps animation loop: move, then bounce off the walls.
useInterval(() => {
  const maxX = Math.max(0, cols.value - boxWidth.value)
  const maxY = Math.max(0, rows.value - boxHeight.value)

  pos.x += vel.x
  pos.y += vel.y

  if (pos.x <= 0) ((pos.x = 0), (vel.x = Math.abs(vel.x)))
  if (pos.x >= maxX) ((pos.x = maxX), (vel.x = -Math.abs(vel.x)))
  if (pos.y <= 0) ((pos.y = 0), (vel.y = Math.abs(vel.y)))
  if (pos.y >= maxY) ((pos.y = maxY), (vel.y = -Math.abs(vel.y)))
}, 1000 / 30)
</script>

<template>
  <Box
    position="absolute"
    :left="left"
    :top="top"
    :width="boxWidth"
    :height="boxHeight"
    border
    borderStyle="rounded"
    :padding="1"
    flexDirection="column"
    :gap="1"
  >
    <Text bold fg="#42b883">vue-termui 👋</Text>
    <Text fg="#888888">Uptime: {{ seconds }}s</Text>
    <Text fg="#888888">Press q or Ctrl+C to exit</Text>
  </Box>
</template>
```

## Key ideas

- **`useInterval` is the animation loop.** Each tick mutates `pos`; the template re-renders and the renderer redraws. At `1000 / 30` ms you get ~30 fps. The interval is cleaned up automatically when the component unmounts.
- **`position="absolute"`** takes the box out of flow so `top` / `left` place it exactly. The renderer rounds nothing for you — we keep float positions for smooth motion and round only when binding `top`/`left`.
- **`useTerminalSize` keeps it responsive.** Because `cols` / `rows` are reactive, the bounds (`maxX` / `maxY`) and the box size recompute when the user resizes the terminal — the box keeps bouncing within the new edges.
- **`useExit`** gives a clean <kbd>q</kbd>-to-quit on top of the built-in <kbd>Ctrl</kbd>+<kbd>C</kbd>.

From here, try varying the velocity on each bounce, trailing multiple boxes, or changing color based on position.
