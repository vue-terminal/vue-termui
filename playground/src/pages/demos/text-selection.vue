<script setup lang="ts">
// Ported from opentui packages/examples/src/text-selection-demo.ts
import {
  bold,
  Box,
  fg,
  italic,
  onKeyDown,
  onScopeDispose,
  ref,
  t,
  Text,
  useRenderer,
} from 'vue-termui'

// Hex stand-ins for the original color helpers (yellow/cyan/green/magenta).
const yellow = fg('#f1e05a')
const cyan = fg('#79c0ff')
const green = fg('#7ee787')
const magenta = fg('#d2a8ff')

const renderer = useRenderer()

const statusText = ref('No selection - try selecting across different nested elements')
const selectionStart = ref('')
const selectionMiddle = ref('')
const selectionEnd = ref('')
const debugText = ref('')

// Selection changes arrive as a renderer event; read the live selection off
// the renderer (the event payload is untyped).
const selectionHandler = () => {
  const selection = renderer.getSelection()
  if (!selection) return

  const selectedText = selection.getSelectedText()
  const container = renderer.getSelectionContainer()
  debugText.value = `Selected renderables: ${selection.selectedRenderables.length} | Container: ${container?.id ?? 'none'}`

  if (selectedText) {
    const lines = selectedText.split('\n')
    const totalLength = selectedText.length

    if (lines.length > 1) {
      statusText.value = `Selected ${lines.length} lines (${totalLength} chars):`
      selectionStart.value = lines[0]!
      selectionMiddle.value = '...'
      selectionEnd.value = lines[lines.length - 1]!
    } else if (selectedText.length > 60) {
      statusText.value = `Selected ${totalLength} chars:`
      selectionStart.value = selectedText.substring(0, 30)
      selectionMiddle.value = '...'
      selectionEnd.value = selectedText.substring(selectedText.length - 30)
    } else {
      statusText.value = `Selected ${totalLength} chars:`
      selectionStart.value = `"${selectedText}"`
      selectionMiddle.value = ''
      selectionEnd.value = ''
    }
  } else {
    statusText.value = 'Empty selection'
    selectionStart.value = ''
    selectionMiddle.value = ''
    selectionEnd.value = ''
  }
}
renderer.on('selection', selectionHandler)
onScopeDispose(() => {
  renderer.off('selection', selectionHandler)
  renderer.clearSelection()
})

onKeyDown((key) => {
  if (key.name === 'c') {
    renderer.clearSelection()
    statusText.value = 'Selection cleared'
    selectionStart.value = ''
    selectionMiddle.value = ''
    selectionEnd.value = ''
    debugText.value = ''
  }
})
</script>

<template>
  <Box flexDirection="column" :gap="1">
    <Box
      backgroundColor="#161b22"
      borderColor="#50565d"
      title="Text Selection Demo"
      titleAlignment="center"
      :border="true"
      flexDirection="column"
      :padding="1"
      :gap="1"
    >
      <Box flexDirection="row" :gap="2" alignItems="flex-start">
        <Box flexDirection="column">
          <Box
            :width="45"
            backgroundColor="#1e2936"
            borderColor="#58a6ff"
            title="Document Section 1"
            flexDirection="column"
            :padding="1"
            :border="true"
          >
            <Text fg="#f0f6fc">This is a paragraph in the first box.</Text>
            <Text fg="#f0f6fc">It contains multiple lines of text</Text>
            <Text fg="#f0f6fc">that can be selected independently.</Text>
            <Text fg="#f0f6fc">世界, 你好世界, 中文, 한글</Text>
          </Box>
          <Box
            :marginLeft="2"
            :width="33"
            backgroundColor="#2d1b69"
            borderColor="#a371f7"
            borderStyle="double"
            :border="true"
            :paddingX="1"
          >
            <Text
              selectionBg="#4a5568"
              selectionFg="#ffffff"
              :content="
                t`${yellow('Important:')} ${bold(cyan('Nested content'))} ${italic(green('with styles'))}`
              "
            />
          </Box>
        </Box>

        <Box
          :width="35"
          backgroundColor="#1c2128"
          borderColor="#f85149"
          title="Code Example"
          borderStyle="rounded"
          flexDirection="column"
          :padding="1"
          :border="true"
        >
          <Text
            selectionBg="#4a5568"
            :content="t`${magenta('function')} ${cyan('handleSelection')}() {`"
          />
          <Text
            selectionBg="#4a5568"
            :content="t`  ${magenta('const')} selected = ${cyan('getSelectedText')}()`"
          />
          <Text
            selectionBg="#4a5568"
            :content="t`  ${yellow('console')}.${green('log')}(selected)`"
          />
          <Text fg="#e6edf3">}</Text>
        </Box>

        <Box
          :width="31"
          backgroundColor="#1b2f23"
          borderColor="#2ea043"
          title="README"
          borderStyle="single"
          :border="true"
        >
          <Text
            selectionBg="#4a5568"
            selectionFg="#ffffff"
            :content="
              t`${bold(cyan('Selection Demo'))}
${green('✓')} Cross-renderable selection
${green('✓')} Nested groups and boxes
${green('✓')} Styled text support`
            "
          />
        </Box>
      </Box>

      <Text fg="#f0f6fc"
        >Click and drag to select text across any elements. Press 'c' to clear selection.</Text
      >
    </Box>

    <Box
      backgroundColor="#0d1117"
      borderColor="#50565d"
      title="Selection Status"
      titleAlignment="left"
      flexDirection="column"
      :padding="1"
      :border="true"
    >
      <Text fg="#f0f6fc">{{ statusText }}</Text>
      <Text fg="#7dd3fc">{{ selectionStart }}</Text>
      <Text fg="#94a3b8">{{ selectionMiddle }}</Text>
      <Text fg="#7dd3fc">{{ selectionEnd }}</Text>
      <Text fg="#e6edf3">{{ debugText }}</Text>
    </Box>
  </Box>
</template>
