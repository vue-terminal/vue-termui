# Layout & Boxes

`<Box>` is the workhorse of Vue TermUI — the terminal equivalent of a `<div>`. It's a **flexbox container**: layout, borders, padding, margins and background are all handled natively by OpenTUI, so the props read just like CSS flexbox.

```vue
<script setup lang="ts">
import { Box, Text } from 'vue-termui'
</script>

<template>
  <Box flexDirection="column" :gap="1" border borderStyle="rounded" :padding="1">
    <Text>First row</Text>
    <Text>Second row</Text>
  </Box>
</template>
```

## Flex direction

Boxes lay their children out in a row by default. Switch to a column with `flexDirection`:

```vue-html
<Box flexDirection="row">...</Box>     <!-- left → right (default) -->
<Box flexDirection="column">...</Box>  <!-- top → bottom -->
```

`row-reverse` and `column-reverse` are also supported.

## Alignment

Two props position children inside a box, exactly like CSS:

- **`justifyContent`** — alignment along the main axis
- **`alignItems`** — alignment along the cross axis

```vue-html
<Box
  :width="30"
  :height="10"
  justifyContent="center"
  alignItems="center"
  border
>
  <Text>perfectly centered</Text>
</Box>
```

`justifyContent` accepts `flex-start`, `center`, `flex-end`, `space-between`, `space-around` and `space-evenly`. `alignItems` (and the per-child `alignSelf`) accept `flex-start`, `center`, `flex-end` and `stretch`.

## Gaps

Add space _between_ children with `gap` (or the axis-specific `rowGap` / `columnGap`):

```vue-html
<Box flexDirection="column" :gap="1">
  <Text>line one</Text>
  <Text>line two</Text>  <!-- one blank row above -->
</Box>
```

## Sizing

Sizes are measured in **terminal cells** (columns wide, rows tall). They accept a number, a percentage string, or `'auto'`:

```vue-html
<Box :width="40" :height="10" />
<Box width="50%" />
<Box width="auto" />
```

Constraints work too: `minWidth`, `minHeight`, `maxWidth`, `maxHeight`.

### Growing and shrinking

Use the flex props to distribute available space:

```vue-html
<Box flexDirection="row">
  <Box :width="20" />          <!-- fixed -->
  <Box :flexGrow="1" />        <!-- takes the rest -->
</Box>
```

`flexGrow`, `flexShrink` and `flexBasis` behave like their CSS counterparts.

## Spacing

`padding` adds space inside the box; `margin` adds space outside. Both expand into per-side and per-axis shorthands:

```vue-html
<Box :padding="1" />        <!-- all sides -->
<Box :paddingX="2" />       <!-- left + right -->
<Box :paddingY="1" />       <!-- top + bottom -->
<Box :paddingTop="1" :paddingLeft="2" />
```

The same pattern applies to `margin` / `marginX` / `marginY` / `marginTop`…

## Borders

Turn on a border with `border`, pick a preset with `borderStyle`, and color it with `borderColor`:

```vue-html
<Box border borderStyle="rounded" borderColor="#42b883">
  <Text>boxed in</Text>
</Box>
```

Available `borderStyle` presets: `single`, `double`, `rounded`, `heavy` and `none`.

A box can also show a **title** in its top border:

```vue-html
<Box border title=" Settings " titleAlignment="center">
  <Text>…</Text>
</Box>
```

## Background color

```vue-html
<Box backgroundColor="#1e1e2e" :padding="1">
  <Text>on a dark panel</Text>
</Box>
```

## Positioning

By default boxes flow in the layout. Set `position="absolute"` to take a box out of flow and place it with `top` / `right` / `bottom` / `left` — handy for overlays and animations:

```vue-html
<Box position="absolute" :top="2" :left="4" :width="20" :height="6" border>
  <Text>floating</Text>
</Box>
```

`zIndex` controls stacking order, and `overflow` (`visible` / `hidden` / `scroll`) controls what happens to content that doesn't fit.

## A worked example

```vue
<script setup lang="ts">
import { Box, Text } from 'vue-termui'
</script>

<template>
  <Box flexDirection="column" :gap="1">
    <Text bold fg="#42b883">Layout demo</Text>

    <!-- A row of three fixed-size colored boxes -->
    <Box flexDirection="row" :gap="2" border :padding="1">
      <Box backgroundColor="#42b883" :width="6" :height="3" />
      <Box backgroundColor="#35495e" :width="6" :height="3" />
      <Box backgroundColor="#ff8800" :width="6" :height="3" />
    </Box>

    <!-- A centered column -->
    <Box flexDirection="column" alignItems="center" :width="30" border :padding="1">
      <Text>centered</Text>
      <Text fg="#888888">via alignItems</Text>
    </Box>
  </Box>
</template>
```

See the full [`<Box>` reference](../components/box) for every prop.
