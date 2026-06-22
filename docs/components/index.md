# Built-in Components

Vue TermUI ships a small, composable set of components. They're **unprefixed** (`Box`, `Text`, …) — there's no DOM to clash with in a terminal — and imported explicitly from `vue-termui`:

```ts
import { Box, Text, Newline, Input, Select, ProgressBar } from 'vue-termui'
```

## The components

| Component                         | Purpose                                             |
| --------------------------------- | --------------------------------------------------- |
| [`<Box>`](./box)                  | Flexbox container — layout, borders, spacing, color |
| [`<Text>`](./text)                | Styled text — colors and attributes                 |
| [`<Newline>`](./newline)          | One or more line breaks                             |
| [`<Input>`](./input)              | Single-line text input with `v-model`               |
| [`<Select>`](./select)            | Scrollable single-choice list with `v-model`        |
| [`<ProgressBar>`](./progress-bar) | Horizontal progress bar                             |

## Host tags

Under the hood, components compile to lowercase **host tags** that the renderer understands directly: `<box>`, `<text>`, `<input>` and `<select>`. These work in templates too, but the components give you typed props, sensible defaults, and prop coercion — so prefer the components in app code.

```vue-html
<!-- equivalent, but prefer <Box> / <Text> -->
<box>
  <text>hello</text>
</box>
```

## No auto-import

Vue TermUI does **not** register a global component resolver or auto-import plugin. Import what you use, explicitly. It's a little more typing, but everything stays fully typed and there's no build-time magic to reason about.

::: tip Coming from the old version?
The previous, pre-OpenTUI version had a `Tui`-prefix (`TuiBox`), auto-imports, a class-based style syntax, and `<Link>` / `<TextTransform>` components. The rewrite drops the prefix and the magic; `<Link>` and `<TextTransform>` are not yet ported.
:::
