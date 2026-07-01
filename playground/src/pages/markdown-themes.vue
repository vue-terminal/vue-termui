<script setup lang="ts">
// Themes are *examples*, not part of vue-termui: a theme is just a scope→style
// map fed to `SyntaxStyle.fromStyles(...)` and passed to `<Markdown>` via the
// `syntaxStyle` prop. Press `T` to cycle through the presets in
// `../markdown-themes`.
import { Box, computed, Markdown, onKeyDown, ref, SyntaxStyle, Text } from 'vue-termui'
import { markdownThemes } from '../markdown-themes'

const index = ref(0)
const theme = computed(() => markdownThemes[index.value]!)

// Rebuild the SyntaxStyle whenever the selected theme changes.
const syntaxStyle = computed(() => SyntaxStyle.fromStyles(theme.value.styles))

onKeyDown((key) => {
  if (key.name === 't') index.value = (index.value + 1) % markdownThemes.length
})

const content = `# Markdown themes

Press **T** to cycle themes. A theme is just a \`SyntaxStyle\` you pass to the
\`syntaxStyle\` prop — see [the docs](https://opentui.com/docs/components/markdown).

## Syntax highlighting

- Inline \`code\`, **bold**, and *italic*
- Fenced blocks pick up per-language colors

\`\`\`ts
import { Markdown, SyntaxStyle } from 'vue-termui'

const answer: number = 42
function greet(name: string) {
  return \`hi \${name}\`
}
\`\`\`

\`\`\`diff
- const renderer = oldMarkdown
+ const renderer = experimentalMarkdown
\`\`\`

> Blockquotes, tables and diffs are themed too.

| Scope        | Example        |
| ------------ | -------------- |
| markup.list  | bullets        |
| keyword      | const/function |
`
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Box flexDirection="row" :gap="1">
      <Text bold fg="#42b883">Markdown themes</Text>
      <Text fg="#888888">— press T to switch ·</Text>
      <Text bold>{{ theme.name }}</Text>
      <Text fg="#888888">({{ index + 1 }}/{{ markdownThemes.length }})</Text>
    </Box>

    <Box borderStyle="single" :padding="1" :backgroundColor="theme.bg">
      <Markdown :content="content" :syntax-style="syntaxStyle" :fg="theme.fg" :bg="theme.bg" />
    </Box>
  </Box>
</template>
