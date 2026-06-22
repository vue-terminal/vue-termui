# `<Text>`

Styled text. Maps to OpenTUI's text renderable. The text itself is the default slot; boolean props toggle attributes, and `fg` / `bg` set colors.

```vue
<script setup lang="ts">
import { Text } from 'vue-termui'
</script>

<template>
  <Text fg="#42b883" bold>vue-termui</Text>
</template>
```

See [Styling Text](../essentials/text) for the guide. This page is the full prop reference.

## Props

| Prop            | Type                             | Description                               |
| --------------- | -------------------------------- | ----------------------------------------- |
| `fg`            | `ColorInput`                     | Foreground (text) color                   |
| `bg`            | `ColorInput`                     | Background color                          |
| `bold`          | `boolean`                        | Bolder weight                             |
| `dim`           | `boolean`                        | Reduced intensity                         |
| `italic`        | `boolean`                        | Italic                                    |
| `underline`     | `boolean`                        | Underlined                                |
| `strikethrough` | `boolean`                        | Struck through                            |
| `inverse`       | `boolean`                        | Swap foreground and background            |
| `blink`         | `boolean`                        | Blinking (terminal-dependent)             |
| `wrap`          | `'none'` \| `'char'` \| `'word'` | How text wraps when it overflows its line |

`ColorInput` is a hex/name string (e.g. `'#42b883'`, `'red'`) or an OpenTUI `RGBA` instance.

## Colors

```vue-html
<Text fg="#42b883">green</Text>
<Text fg="red">named</Text>
<Text fg="#0b0b0b" bg="#42b883">dark on green</Text>
```

## Attributes combine

```vue-html
<Text bold italic underline fg="#ff8800">emphasis</Text>
```

## Nesting and interpolation

`<Text>` nests, and supports interpolation, `v-if` and `v-for`:

```vue-html
<Text>Status: <Text bold :fg="ok ? '#42b883' : 'red'">{{ ok ? 'OK' : 'FAIL' }}</Text></Text>
```

## Wrapping

`wrap` only matters when the text is constrained by its container's width:

```vue-html
<Box :width="20">
  <Text wrap="word">A longer sentence that wraps onto multiple lines.</Text>
</Box>
```

## Line breaks

For blank lines between text, use [`<Newline>`](./newline).
