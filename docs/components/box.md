# `<Box>`

A flexbox container — the terminal equivalent of a `<div>`. It maps to OpenTUI's box renderable, which owns layout (real flexbox), borders, padding/margin and background natively. Children go in the default slot.

```vue
<script setup lang="ts">
import { Box, Text } from 'vue-termui'
</script>

<template>
  <Box border borderStyle="rounded" :padding="1" flexDirection="column" :gap="1">
    <Text bold>Title</Text>
    <Text>Body</Text>
  </Box>
</template>
```

See [Layout & Boxes](../essentials/layout) for a guided tour. This page is the full prop reference.

## Sizing

| Prop                     | Type        | Description                         |
| ------------------------ | ----------- | ----------------------------------- |
| `width` / `height`       | `Dimension` | Size in cells, `'auto'`, or a `'%'` |
| `minWidth` / `minHeight` | `Dimension` | Lower bound                         |
| `maxWidth` / `maxHeight` | `Dimension` | Upper bound                         |

`Dimension` is `number | 'auto' | \`${number}%\``.

## Flex layout

| Prop             | Type                                                                                                      | Default |
| ---------------- | --------------------------------------------------------------------------------------------------------- | ------- |
| `flexDirection`  | `'row'` \| `'column'` \| `'row-reverse'` \| `'column-reverse'`                                            | `'row'` |
| `flexGrow`       | `number`                                                                                                  | —       |
| `flexShrink`     | `number`                                                                                                  | —       |
| `flexBasis`      | `number` \| `'auto'`                                                                                      | —       |
| `flexWrap`       | `'no-wrap'` \| `'wrap'` \| `'wrap-reverse'`                                                               | —       |
| `alignItems`     | `'flex-start'` \| `'center'` \| `'flex-end'` \| `'stretch'`                                               | —       |
| `alignSelf`      | `'flex-start'` \| `'center'` \| `'flex-end'` \| `'stretch'`                                               | —       |
| `justifyContent` | `'flex-start'` \| `'center'` \| `'flex-end'` \| `'space-between'` \| `'space-around'` \| `'space-evenly'` | —       |
| `gap`            | `number` \| `'%'`                                                                                         | —       |
| `rowGap`         | `number` \| `'%'`                                                                                         | —       |
| `columnGap`      | `number` \| `'%'`                                                                                         | —       |

## Positioning

| Prop                                | Type                                       | Description                        |
| ----------------------------------- | ------------------------------------------ | ---------------------------------- |
| `position`                          | `'static'` \| `'relative'` \| `'absolute'` | Positioning mode                   |
| `top` / `right` / `bottom` / `left` | `Dimension`                                | Offsets when positioned            |
| `zIndex`                            | `number`                                   | Stacking order                     |
| `overflow`                          | `'visible'` \| `'hidden'` \| `'scroll'`    | How overflowing content is handled |

## Spacing

Both `margin` and `padding` expand into per-axis and per-side shorthands:

| Prop      | Variants                                                                             |
| --------- | ------------------------------------------------------------------------------------ |
| `margin`  | `marginX`, `marginY`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`       |
| `padding` | `paddingX`, `paddingY`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft` |

```vue-html
<Box :padding="1" :marginX="2" />
```

## Appearance

| Prop                 | Type                                                 | Description                                            |
| -------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `backgroundColor`    | `ColorInput`                                         | Fill color                                             |
| `border`             | `boolean`                                            | Draw a border                                          |
| `borderStyle`        | `'single'` \| `'double'` \| `'rounded'` \| `'heavy'` | Border preset (hide the border with `:border="false"`) |
| `borderColor`        | `ColorInput`                                         | Border color                                           |
| `focusedBorderColor` | `ColorInput`                                         | Border color while focused                             |
| `title`              | `string`                                             | Text shown in the top border                           |
| `titleAlignment`     | `'left'` \| `'center'` \| `'right'`                  | Title position                                         |

`ColorInput` is a hex/name string or an OpenTUI `RGBA` instance.

## Misc

| Prop        | Type      | Description                       |
| ----------- | --------- | --------------------------------- |
| `visible`   | `boolean` | Hide without removing from layout |
| `opacity`   | `number`  | `0`–`1` opacity                   |
| `focusable` | `boolean` | Allow the box to receive focus    |

## Mouse handlers

Bind OpenTUI's per-element mouse handlers as props (`:onMouseDown`, `:onMouseMove`, …). See [Handling Input → Mouse](../essentials/input#mouse).

```vue-html
<Box :onMouseDown="() => select()">…</Box>
```
