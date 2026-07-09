<script setup lang="ts">
// Ported from @opentui/examples src/text-truncation-demo.ts
import {
  bold,
  Box,
  computed,
  fg,
  onKeyDown,
  onUnmounted,
  ref,
  t,
  Text,
  useRenderer,
} from 'vue-termui'

// The original used the named color helpers; fg() with the same palette hexes.
const green = fg('#3fb950')
const yellow = fg('#d29922')
const cyan = fg('#58a6ff')
const magenta = fg('#bc8cff')

const truncate = ref(false)
const wrapMode = ref<'none' | 'char' | 'word'>('none')

// Column sizes toggled with R (equal → left larger → right larger).
const leftGrow = ref(1)
const rightGrow = ref(1)
function toggleColumnSizes(): void {
  if (leftGrow.value === 1 && rightGrow.value === 1) {
    leftGrow.value = 2
  } else if (leftGrow.value === 2) {
    leftGrow.value = 1
    rightGrow.value = 2
  } else {
    rightGrow.value = 1
  }
}

const styledText = t`${bold(cyan('Bold Cyan:'))} ${yellow('Yellow text')} ${magenta('and magenta')} ${green('with green parts')} and more styled text that goes on and on`

const footerText = computed(() => {
  const truncateStatus = truncate.value ? 'ENABLED' : 'DISABLED'
  const truncateColor = truncate.value ? green : yellow
  const wrapColor = wrapMode.value === 'none' ? yellow : cyan
  return t`Truncate: ${truncateColor(bold(truncateStatus))} | Wrap: ${wrapColor(bold(wrapMode.value.toUpperCase()))} | ${cyan('T')}: toggle truncate | ${cyan('W')}: cycle wrap | ${cyan('R')}: resize | ${cyan('C')}: clear selection`
})

// Selection details (mouse-select some text to fill these in).
const selectionStatus = ref('Select text to see details here')
const selectionStart = ref('')
const selectionMiddle = ref('')
const selectionEnd = ref('')

const renderer = useRenderer()
function onSelection(selection: { getSelectedText(): string } | null): void {
  const selectedText = selection?.getSelectedText()
  if (selectedText) {
    const lines = selectedText.split('\n')
    const totalLength = selectedText.length

    if (lines.length > 1) {
      selectionStatus.value = `Selected ${lines.length} lines (${totalLength} chars):`
      selectionStart.value = lines[0]!
      selectionMiddle.value = '...'
      selectionEnd.value = lines[lines.length - 1]!
    } else if (selectedText.length > 60) {
      selectionStatus.value = `Selected ${totalLength} chars:`
      selectionStart.value = selectedText.slice(0, 30)
      selectionMiddle.value = '...'
      selectionEnd.value = selectedText.slice(-30)
    } else {
      selectionStatus.value = `Selected ${totalLength} chars:`
      selectionStart.value = `"${selectedText}"`
      selectionMiddle.value = ''
      selectionEnd.value = ''
    }
  } else {
    selectionStatus.value = 'Empty selection'
    selectionStart.value = ''
    selectionMiddle.value = ''
    selectionEnd.value = ''
  }
}
renderer.on('selection', onSelection)
onUnmounted(() => renderer.off('selection', onSelection))

onKeyDown((key) => {
  switch (key.name) {
    case 't':
      truncate.value = !truncate.value
      break
    case 'w':
      wrapMode.value =
        wrapMode.value === 'none' ? 'char' : wrapMode.value === 'char' ? 'word' : 'none'
      break
    case 'r':
      toggleColumnSizes()
      break
    case 'c':
      renderer.clearSelection()
      selectionStatus.value = 'Selection cleared'
      selectionStart.value = ''
      selectionMiddle.value = ''
      selectionEnd.value = ''
      break
  }
})
</script>

<template>
  <Box flexDirection="column" :flexGrow="1" backgroundColor="#0d1117">
    <Box
      :height="3"
      backgroundColor="#161b22"
      borderStyle="single"
      borderColor="#30363d"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#58a6ff">Text Truncation Demo - Press 'T' to toggle truncation</Text>
    </Box>

    <Box :flexGrow="1" flexDirection="row" :gap="1" :padding="1">
      <Box :flexGrow="leftGrow" flexDirection="column" :gap="1">
        <Box
          :minHeight="5"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#58a6ff"
          title="Single Line Text 1"
          :padding="1"
        >
          <Text fg="#c9d1d9" :wrapMode="wrapMode" :truncate="truncate">
            This is a very long single line of text that will definitely exceed the width of most
            terminal windows and should be truncated when truncation is enabled
          </Text>
        </Box>

        <Box
          :minHeight="5"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#3fb950"
          title="Single Line Text 2"
          :padding="1"
        >
          <Text fg="#3fb950" :wrapMode="wrapMode" :truncate="truncate">
            ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz
          </Text>
        </Box>

        <Box
          :minHeight="7"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#d29922"
          title="Single Line Text 3 (Unicode)"
          :padding="1"
        >
          <Text fg="#d29922" :wrapMode="wrapMode" :truncate="truncate">
            🌟 Unicode test: こんにちは世界 Hello World 你好世界 안녕하세요 🚀 More emoji:
            🎨🎭🎪🎬🎮🎯
          </Text>
        </Box>
      </Box>

      <Box :flexGrow="rightGrow" flexDirection="column" :gap="1">
        <Box
          :flexGrow="1"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#f778ba"
          title="Multiline Text (Word Wrap)"
          :padding="1"
        >
          <Text fg="#f778ba" :wrapMode="wrapMode" :truncate="truncate">
            This is a multiline text block that demonstrates how truncation works with word wrapping
            enabled. Each line that exceeds the viewport width will be truncated independently. Try
            resizing the terminal to see how it behaves!
          </Text>
        </Box>

        <Box
          :flexGrow="1"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#bc8cff"
          title="Multiline Text"
          :padding="1"
        >
          <Text
            fg="#bc8cff"
            :wrapMode="wrapMode"
            :truncate="truncate"
            :content="`Line 1: This is a long line without wrapping\nLine 2: Another very long line that will be truncated when enabled\nLine 3: Short line\nLine 4: Yet another extremely long line with lots of text to demonstrate middle truncation behavior`"
          />
        </Box>

        <Box
          :flexGrow="1"
          backgroundColor="#161b22"
          borderStyle="rounded"
          borderColor="#ff7b72"
          title="Styled Text with Truncation"
          :padding="1"
        >
          <Text fg="#c9d1d9" :wrapMode="wrapMode" :truncate="truncate" :content="styledText" />
        </Box>
      </Box>
    </Box>

    <Box
      :height="3"
      backgroundColor="#161b22"
      borderStyle="single"
      borderColor="#30363d"
      alignItems="center"
      justifyContent="center"
    >
      <Text fg="#8b949e" :content="footerText" />
    </Box>

    <Box
      :height="7"
      backgroundColor="#0d1117"
      borderStyle="single"
      borderColor="#30363d"
      title="Selection"
      titleAlignment="left"
      flexDirection="column"
      :gap="1"
      :padding="1"
    >
      <Text fg="#8b949e">{{ selectionStatus }}</Text>
      <Text fg="#7dd3fc">{{ selectionStart }}</Text>
      <Text fg="#94a3b8">{{ selectionMiddle }}</Text>
      <Text fg="#7dd3fc">{{ selectionEnd }}</Text>
    </Box>
  </Box>
</template>
