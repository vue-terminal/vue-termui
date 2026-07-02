<script setup lang="ts">
import { Box, computed, Markdown, onKeyDown, ref, SyntaxStyle } from 'vue-termui'
import { markdownThemes } from '../markdown-themes'

// `syntaxStyle` is required — build one from a theme map (see markdown-themes.ts
// for copy-paste presets).
const syntaxStyle = SyntaxStyle.fromStyles(markdownThemes[0]!.styles)

// Bump a counter on space to show that `content` is fully reactive — the block
// re-renders whenever the string changes.
const ticks = ref(0)
onKeyDown((key) => {
  if (key.name === 'space') ticks.value++
})

const content = computed(
  () => `# vue-termui

Build **terminal** UIs with *Vue 3*, rendered by [OpenTUI](https://opentui.com).

## Features

- Reactive content — press \`space\` (${ticks.value}× so far)
- Headings, lists, and inline \`code\`
- Syntax-highlighted fenced blocks and tables

> Markdown markers are concealed by default.

\`\`\`ts
import { Markdown } from 'vue-termui'

const answer: number = 42
function greet(name: string) {
  return \`hi \${name}\`
}
\`\`\`

\`\`\`diff
- const renderer = oldMarkdown
+ const renderer = experimentalMarkdown
\`\`\`

| Component | Maps to            |
| --------- | ------------------ |
| Text      | TextRenderable     |
| Markdown  | MarkdownRenderable |
`,
)
</script>

<template>
  <Box flexDirection="column" :gap="1" borderStyle="rounded" :padding="1">
    <Box borderStyle="single" :padding="1">
      <Markdown
        :content="content"
        :syntax-style="syntaxStyle"
        streaming
        conceal
        @mouseDown="console.log('mouseDown')"
        @focus="console.log('focuse')"
        @blur="console.log('blur')"
        @destroyed="console.log('destroyed')"
      />
    </Box>
  </Box>
</template>
