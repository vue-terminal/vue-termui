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

## Styling part of a line

`<Text>` does **not** nest — a `<Text>` inside another `<Text>` is ignored (with a
warning), the same way the browser drops a `<p>` inside a `<p>`. To give part of a
line its own color or weight, pass a `StyledText` to the [`content`](#content) prop,
built with the `t` / `bold` / `fg` / … helpers re-exported from `vue-termui`:

```vue
<script setup lang="ts">
import { Text, t, bold, fg } from 'vue-termui'

const ok = true
const status = t`Status: ${ok ? bold(fg('#42b883')('OK')) : bold(fg('red')('FAIL'))}`
</script>

<template>
  <Text :content="status" />
</template>
```

Plain interpolation, `v-if` and `v-for` work as usual inside a single `<Text>`:

```vue-html
<Text>Count: {{ count }}</Text>
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
