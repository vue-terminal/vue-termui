<script setup lang="ts">
// Ported from opentui packages/examples/src/text-table-demo.ts
import {
  bold,
  Box,
  computed,
  fg,
  onKeyDown,
  onScopeDispose,
  ref,
  ScrollBox,
  t,
  TableCell,
  TableRow,
  Text,
  TextTable,
  useRenderer,
  useTemplateRef,
} from 'vue-termui'
import type { BorderStyle } from 'vue-termui'

// Chunk helpers shared with the original demo's datasets.
type TextChunk = ReturnType<typeof bold>
function cell(text: string): TextChunk[] {
  return [{ __isChunk: true, text }]
}

const PALETTE = {
  panel: '#0d0d0d',
  text: '#f0f0f0',
  muted: '#666666',
  soft: '#bbbbbb',
  rose: '#e8c97a',
  ember: '#b8a0ff',
  flame: '#ffffff',
  eye: '#00d4aa',
  border: '#2a2a2a',
} as const

const WRAP_MODES = ['none', 'word', 'char'] as const
const BORDER_STYLES: BorderStyle[] = ['single', 'rounded', 'double', 'heavy']
const COLUMN_WIDTH_MODES = ['content', 'full'] as const
const COLUMN_FITTERS = ['proportional', 'balanced'] as const
const CELL_PADDING_VALUES = [0, 1, 2]

const primaryContentSets: TextChunk[][][][] = [
  [
    [[bold('Service')], [bold('Status')], [bold('Notes')]],
    [cell('api'), [fg(PALETTE.eye)('OK')], [fg(PALETTE.muted)('latency'), ...cell(' 28ms')]],
    [cell('worker'), [fg(PALETTE.ember)('DEGRADED')], cell('queue depth: 124')],
    [cell('billing'), [fg(PALETTE.flame)('ERROR')], cell('retrying payment provider')],
  ],
  [
    [[bold('Region')], [bold('Requests')], [bold('Trend')]],
    [cell('us-east-1'), cell('1.2M'), [fg(PALETTE.eye)('+12.4%')]],
    [cell('eu-west-1'), cell('890K'), [fg(PALETTE.soft)('+5.1%')]],
    [cell('ap-south-1'), cell('540K'), [fg(PALETTE.flame)('-2.0%')]],
  ],
  [
    [[bold('Task')], [bold('Owner')], [bold('ETA')]],
    [
      cell(
        'Wrap regression in operational status dashboard with dynamic row heights and constrained layout validation',
      ),
      cell('core platform and runtime reliability squad'),
      [
        fg(PALETTE.eye)(
          'done after validating none, word, and char wrap modes across narrow, medium, wide, and ultra-wide terminal widths',
        ),
      ],
    ],
    [
      cell(
        'Unicode layout stabilization for mixed Latin, punctuation, symbols, and long identifiers in adjacent columns',
      ),
      cell('render pipeline maintainers with fallback shaping support'),
      cell(
        'in review with follow-up checks for border style transitions, cell padding variants, and selection range consistency',
      ),
    ],
    [
      cell(
        'Snapshot pass for table rendering in content mode and full mode with heavy and double border combinations',
      ),
      cell('qa automation and visual diff triage group'),
      cell(
        'today pending final baseline updates for oversized fixtures that intentionally stress wrapping behavior on high-resolution terminals',
      ),
    ],
    [
      cell(
        'Document edge cases where long tokens without spaces force char wrapping and reveal per-cell clipping regressions',
      ),
      cell('developer experience and docs tooling'),
      cell(
        'planned for this sprint once final reproducible examples are captured and linked to regression tracking tickets',
      ),
    ],
    [
      cell(
        'Performance sweep of wrapping algorithm under large datasets to confirm stable frame times during rapid key toggling',
      ),
      cell('runtime performance task force'),
      cell(
        'scheduled after review, with benchmark runs on laptop and desktop terminals at 200-plus column widths',
      ),
    ],
  ],
]

const unicodeContentSets: TextChunk[][][][] = [
  [
    [[bold('Locale')], [bold('Sample')]],
    [cell('ja-JP'), cell('東京の夜景と絵文字 🌃✨')],
    [cell('zh-CN'), cell('你好世界，布局检查中 🚀')],
    [cell('ko-KR'), cell('한글과 이모지 조합 테스트 😄')],
  ],
  [
    [[bold('Expression')], [bold('Meaning')]],
    [cell('山川异域'), cell('Different lands, shared sky 🌏')],
    [cell('꽃길만 걷자'), cell('Walk only flower paths 🌸')],
    [cell('加油'), cell('Keep pushing forward 💪')],
  ],
  [
    [[bold('Column')], [bold('Wrapped Text')]],
    [
      cell('mixed-languages'),
      cell(
        'CJK and emoji wrapping stress case: こんにちは世界 and 안녕하세요 세계 and 你好，世界 followed by long English prose that keeps flowing to test whether each cell wraps naturally even when the terminal is extremely wide and the row still needs multiple visual lines for readability 🌍🚀',
      ),
    ],
    [
      cell('emoji-and-symbols'),
      cell(
        'Faces 😀😃😄😁😆 plus symbols 🧪📦🛰️🔧📊 mixed with version tags like release-candidate-build-2026-02-very-long-token-without-breaks to ensure char wrapping remains stable and no glyph alignment issues appear at column boundaries',
      ),
    ],
    [
      cell('long-cjk-phrase'),
      cell(
        '長文の日本語テキストと中文段落和한국어문장을連続して配置し、その後に additional English context describing renderer behavior, border intersection handling, and selection extraction so that this single cell remains a reliable wrapping torture test.',
      ),
    ],
    [
      cell('mixed-punctuation'),
      cell(
        'Wrap behavior with punctuation-heavy content: [alpha]{beta}(gamma)<delta>|epsilon| then repeated fragments, commas, semicolons, and slashes to verify token boundaries do not break border drawing logic or spacing consistency in neighboring columns.',
      ),
    ],
  ],
]

const contentIndex = ref(0)
const wrapIndex = ref(1)
const borderIndex = ref(0)
const columnWidthModeIndex = ref(0)
const columnFitterIndex = ref(0)
const cellPaddingIndex = ref(0)
const borderEnabled = ref(true)
const outerBorderEnabled = ref(true)
const showBordersEnabled = ref(true)

const wrapMode = computed(() => WRAP_MODES[wrapIndex.value] ?? 'word')
const borderStyle = computed(() => BORDER_STYLES[borderIndex.value] ?? 'single')
const columnWidthMode = computed(() => COLUMN_WIDTH_MODES[columnWidthModeIndex.value] ?? 'content')
const columnFitter = computed(() => COLUMN_FITTERS[columnFitterIndex.value] ?? 'proportional')
const cellPadding = computed(() => CELL_PADDING_VALUES[cellPaddingIndex.value] ?? 0)

// The primary table is rendered declaratively with <TableRow>/<TableCell>;
// the unicode table takes the raw content matrix like the original demo.
const primaryContent = computed(
  () => primaryContentSets[contentIndex.value] ?? primaryContentSets[0]!,
)
const unicodeContent = computed(
  () => unicodeContentSets[contentIndex.value] ?? unicodeContentSets[0]!,
)

const controlsContent = computed(
  () => t`${bold('TextTable Demo')}  ${fg(PALETTE.muted)('1/2/3 dataset • W wrap • B style • M width • F fitter • P padding • N inner • O outer • H draw • drag to select • C clear')}
Current: dataset ${fg(PALETTE.soft)(String(contentIndex.value + 1))} | wrap ${fg(PALETTE.rose)(wrapMode.value)} | style ${fg(PALETTE.ember)(borderStyle.value)} | width ${fg(PALETTE.eye)(columnWidthMode.value)} | fitter ${fg(PALETTE.rose)(columnFitter.value)} | padding ${fg(PALETTE.soft)(String(cellPadding.value))} | inner ${fg(PALETTE.rose)(borderEnabled.value ? 'on' : 'off')} | outer ${fg(PALETTE.ember)(outerBorderEnabled.value ? 'on' : 'off')} | draw ${fg(PALETTE.eye)(showBordersEnabled.value ? 'on' : 'off')}`,
)

// Selection status panel
const renderer = useRenderer()
const selectionMeta = ref('No selection yet')
const selectionText = ref('')
const selectionScroll = useTemplateRef('selectionScroll')

function clearSelectionStatus(message: string) {
  selectionMeta.value = message
  selectionText.value = ''
  if (selectionScroll.value) selectionScroll.value.$el.scrollTop = 0
}

const selectionHandler = () => {
  const selectedText = renderer.getSelection()?.getSelectedText()
  if (!selectedText) {
    clearSelectionStatus('Empty selection')
    return
  }

  const lines = selectedText.split('\n').length
  selectionMeta.value = `Selected ${lines} line${lines === 1 ? '' : 's'} (${selectedText.length} chars)`
  selectionText.value = selectedText
  if (selectionScroll.value) selectionScroll.value.$el.scrollTop = 0
}
renderer.on('selection', selectionHandler)
onScopeDispose(() => {
  renderer.off('selection', selectionHandler)
  renderer.clearSelection()
})

onKeyDown((key) => {
  if (key.ctrl || key.meta) return

  if (key.name === '1' || key.name === '2' || key.name === '3') {
    contentIndex.value = Number(key.name) - 1
  } else if (key.name === 'w') {
    wrapIndex.value = (wrapIndex.value + 1) % WRAP_MODES.length
  } else if (key.name === 'b') {
    borderIndex.value = (borderIndex.value + 1) % BORDER_STYLES.length
  } else if (key.name === 'm') {
    columnWidthModeIndex.value = (columnWidthModeIndex.value + 1) % COLUMN_WIDTH_MODES.length
  } else if (key.name === 'f') {
    columnFitterIndex.value = (columnFitterIndex.value + 1) % COLUMN_FITTERS.length
  } else if (key.name === 'p') {
    cellPaddingIndex.value = (cellPaddingIndex.value + 1) % CELL_PADDING_VALUES.length
  } else if (key.name === 'n') {
    borderEnabled.value = !borderEnabled.value
  } else if (key.name === 'o') {
    outerBorderEnabled.value = !outerBorderEnabled.value
  } else if (key.name === 'h') {
    showBordersEnabled.value = !showBordersEnabled.value
  } else if (key.name === 'c') {
    renderer.clearSelection()
    clearSelectionStatus('Selection cleared')
  }
})
</script>

<template>
  <Box width="100%" height="100%" flexDirection="column" :padding="1" :gap="1">
    <ScrollBox
      width="100%"
      :flexGrow="1"
      :flexShrink="1"
      scrollY
      :border="false"
      :verticalScrollbarOptions="{ visible: false }"
      :contentOptions="{ flexDirection: 'column', gap: 1 }"
    >
      <Text :fg="PALETTE.text" wrapMode="word" :selectable="false" :content="controlsContent" />

      <Text :fg="PALETTE.ember" :selectable="false" :content="t`${bold('Operational Table')}`" />
      <TextTable
        width="100%"
        :wrapMode="wrapMode"
        :columnWidthMode="columnWidthMode"
        :columnFitter="columnFitter"
        :cellPadding="cellPadding"
        :border="borderEnabled"
        :outerBorder="outerBorderEnabled"
        :showBorders="showBordersEnabled"
        :borderStyle="borderStyle"
        :borderColor="PALETTE.rose"
        :fg="PALETTE.text"
      >
        <TableRow v-for="(row, rowIdx) in primaryContent" :key="rowIdx">
          <TableCell v-for="(chunks, colIdx) in row" :key="colIdx" :content="chunks" />
        </TableRow>
      </TextTable>

      <Text
        :fg="PALETTE.rose"
        :selectable="false"
        :content="t`${bold('Unicode/CJK/Emoji Table')}`"
      />
      <TextTable
        width="100%"
        :content="unicodeContent"
        :wrapMode="wrapMode"
        :columnWidthMode="columnWidthMode"
        :columnFitter="columnFitter"
        :cellPadding="cellPadding"
        :border="borderEnabled"
        :outerBorder="outerBorderEnabled"
        :showBorders="showBordersEnabled"
        :borderStyle="borderStyle"
        :borderColor="PALETTE.rose"
        :fg="PALETTE.text"
      />

      <Text
        :fg="PALETTE.eye"
        :selectable="false"
        :content="
          t`${bold('Static Table')} ${fg(PALETTE.muted)('(declarative <TableRow>/<TableCell>, unaffected by the toggles)')}`
        "
      />
      <!-- Row styles cascade to every cell; cell props and content chunks win. -->
      <TextTable
        borderStyle="rounded"
        :borderColor="PALETTE.eye"
        :cellPadding="1"
        columnWidthMode="content"
        :fg="PALETTE.text"
      >
        <TableRow bold :fg="PALETTE.eye">
          <TableCell>Package</TableCell>
          <TableCell>Version</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>vue-termui</TableCell>
          <TableCell dim>0.1.0</TableCell>
          <TableCell fg="#7ee787">stable</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>@vue-termui/three</TableCell>
          <TableCell dim>0.2.3</TableCell>
          <TableCell :content="t`${fg('#f1e05a')('beta')} ${fg(PALETTE.muted)('(3D)')}`" />
        </TableRow>
        <TableRow dim italic>
          <TableCell>legacy-renderer</TableCell>
          <TableCell>0.0.9</TableCell>
          <TableCell strikethrough>deprecated</TableCell>
        </TableRow>
      </TextTable>
    </ScrollBox>

    <Box
      width="100%"
      :height="10"
      :flexGrow="0"
      :flexShrink="0"
      border
      borderStyle="double"
      :borderColor="PALETTE.border"
      title="Selected Text"
      titleAlignment="left"
      :padding="1"
      :backgroundColor="PALETTE.panel"
      flexDirection="column"
    >
      <Text :fg="PALETTE.eye" :selectable="false">{{ selectionMeta }}</Text>
      <ScrollBox
        ref="selectionScroll"
        width="100%"
        :flexGrow="1"
        :flexShrink="1"
        scrollY
        :border="false"
        :verticalScrollbarOptions="{ visible: false }"
      >
        <Text :fg="PALETTE.text" wrapMode="word" width="100%" :selectable="false">
          {{ selectionText }}
        </Text>
      </ScrollBox>
    </Box>
  </Box>
</template>
