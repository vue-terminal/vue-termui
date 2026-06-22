# `<Newline>`

Inserts one or more line breaks. It renders a text node of `count` newline characters — handy for spacing rows of text apart without reaching for layout props.

```vue
<script setup lang="ts">
import { Text, Newline } from 'vue-termui'
</script>

<template>
  <Text>first</Text>
  <Newline :count="2" />
  <Text>second</Text>
</template>
```

## Props

| Prop    | Type     | Default | Description                    |
| ------- | -------- | ------- | ------------------------------ |
| `count` | `number` | `1`     | How many line breaks to insert |

## When to use it

For spacing between rows in a column layout, `gap` on a [`<Box>`](./box) is usually cleaner:

```vue-html
<Box flexDirection="column" :gap="1">
  <Text>first</Text>
  <Text>second</Text>
</Box>
```

Reach for `<Newline>` when you want a break **within a flow of text** — for instance separating paragraphs inside a single block, or adding vertical breathing room between inline `<Text>` runs.
