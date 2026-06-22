# `<ProgressBar>`

A horizontal progress bar. It's a small composite of [`<Box>`](./box) and [`<Text>`](./text) (OpenTUI has no native progress renderable): the filled portion is drawn in `color`, the remainder in `trackColor`.

```vue
<script setup lang="ts">
import { ProgressBar, ref } from 'vue-termui'

const downloaded = ref(40)
const total = 100
</script>

<template>
  <ProgressBar :value="downloaded" :max="total" :width="30" color="#42b883" />
</template>
```

## Props

| Prop         | Type         | Default     | Description                             |
| ------------ | ------------ | ----------- | --------------------------------------- |
| `value`      | `number`     | _required_  | Current progress, between `0` and `max` |
| `max`        | `number`     | `1`         | The value representing 100%             |
| `width`      | `number`     | `25`        | Total width of the bar, in cells        |
| `color`      | `ColorInput` | `'#42b883'` | Color of the filled portion             |
| `trackColor` | `ColorInput` | `'#3a3a3a'` | Color of the unfilled track             |
| `char`       | `string`     | `'█'`       | Character used to draw the bar          |

The bar fills proportionally to `value / max`, clamped to the `0`–`100%` range.

## Examples

A determinate bar driven by a ref:

```vue
<script setup lang="ts">
import { ProgressBar, ref, useInterval } from 'vue-termui'

const value = ref(0)
useInterval(() => {
  value.value = (value.value + 1) % 101
}, 100)
</script>

<template>
  <ProgressBar :value="value" :max="100" :width="40" />
</template>
```

Tie it to real work — for example, how full an input is:

```vue
<script setup lang="ts">
import { Box, Input, ProgressBar, Text, ref, computed } from 'vue-termui'

const name = ref('')
const max = 20
const filled = computed(() => Math.min(name.value.length, max))
</script>

<template>
  <Input v-model="name" :maxLength="max" focus placeholder="Type…" />
  <Box flexDirection="row" :gap="1">
    <ProgressBar :value="filled" :max="max" :width="max" />
    <Text fg="#888888">{{ filled }}/{{ max }}</Text>
  </Box>
</template>
```

Customize the look with `char` and colors:

```vue-html
<ProgressBar :value="60" :max="100" char="▒" color="#ff8800" trackColor="#222222" />
```
