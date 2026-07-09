# Styling Text

All visible text lives inside a `<Text>` component. It maps to OpenTUI's text renderable and exposes colors plus the usual terminal text attributes as props. The text itself goes in the default slot:

```vue
<script setup lang="ts">
import { Text } from 'vue-termui'
</script>

<template>
  <Text bold fg="#42b883">vue-termui</Text>
</template>
```

## Colors

Set the foreground with `fg` and the background with `bg`. Colors accept hex strings, CSS color names, or an OpenTUI `RGBA` instance:

```vue-html
<Text fg="#42b883">green text</Text>
<Text fg="red">named color</Text>
<Text fg="#0b0b0b" bg="#42b883">dark on green</Text>
```

## Attributes

Boolean props toggle the standard terminal text styles. They combine freely:

```vue-html
<Text bold>bold</Text>
<Text dim>dim</Text>
<Text italic>italic</Text>
<Text underline>underline</Text>
<Text strikethrough>strikethrough</Text>
<Text inverse>inverse</Text>
<Text blink>blink</Text>

<Text bold italic underline fg="#ff8800">all at once</Text>
```

| Prop            | Effect                         |
| --------------- | ------------------------------ |
| `bold`          | Bolder weight                  |
| `dim`           | Reduced intensity              |
| `italic`        | Italic                         |
| `underline`     | Underlined                     |
| `strikethrough` | Struck through                 |
| `inverse`       | Swap foreground and background |
| `blink`         | Blinking (terminal-dependent)  |

::: tip
Some attributes (notably `blink`) depend on terminal support and may render differently or not at all.
:::

## Interpolation and inline styling

`<Text>` works with everything you'd expect from a Vue template — interpolation,
`v-if` and `v-for`:

```vue
<script setup lang="ts">
import { Text, ref } from 'vue-termui'
const name = ref('world')
</script>

<template>
  <Text>Hello, {{ name }}!</Text>
</template>
```

`<Text>` does **not** nest, though — a `<Text>` inside another `<Text>` is ignored
(with a warning), like a `<p>` inside a `<p>` in the browser. To style just part of
a line, pass a `StyledText` to the `content` prop, built with the `t` / `bold` /
`fg` / … helpers re-exported from `vue-termui`:

```vue
<script setup lang="ts">
import { Text, t, bold, fg, ref } from 'vue-termui'
const name = ref('world')
</script>

<template>
  <Text :content="t`Hello, ${bold(fg('#42b883')(name))}!`" />
</template>
```

## Wrapping

When text is longer than its container, `wrap` controls how it breaks:

```vue-html
<Box :width="20">
  <Text wrap="word">A longer sentence that needs to wrap across lines.</Text>
</Box>
```

- **`word`** — break on word boundaries
- **`char`** — break anywhere, including mid-word
- **`none`** — never wrap (text may be clipped)

## Line breaks

To insert blank lines between blocks of text, use [`<Newline>`](../components/newline):

```vue-html
<Text>first</Text>
<Newline :count="2" />
<Text>second</Text>
```

## Plain host tag

`<Text>` compiles down to a `<tui-text>` host element. You _can_ write that directly, but the component gives you typed props and attribute coercion, so prefer `<Text>` in your apps.

See the full [`<Text>` reference](../components/text) for the complete prop list.
