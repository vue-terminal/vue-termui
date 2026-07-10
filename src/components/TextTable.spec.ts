// @vitest-environment node
import { TextAttributes, TextTableRenderable, fg, parseColor } from '@opentui/core'
import { createTestRenderer } from '@opentui/core/testing'
import { createRenderer, h, nextTick, ref } from '@vue/runtime-core'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNodeOps } from '../renderer/nodeOps'
import { TableCell, TableRow, TextTable } from './TextTable'
import type { Renderable, TextChunk, TextTableContent } from '@opentui/core'
import type { TestRendererSetup } from '@opentui/core/testing'
import type { VNode } from '@vue/runtime-core'

describe('TextTable', () => {
  let test: TestRendererSetup
  let render: (vnode: VNode | null, container: Renderable) => void

  beforeEach(async () => {
    test = await createTestRenderer({ width: 60, height: 20 })
    render = createRenderer(createNodeOps(test.renderer)).render
  })

  afterEach(() => {
    test.renderer.destroy()
  })

  function mountedTable(): TextTableRenderable {
    return test.renderer.root.getChildren()[0] as TextTableRenderable
  }

  function chunk(text: string): TextChunk[] {
    return [{ __isChunk: true, text }]
  }

  it('renders a TextTableRenderable from the content prop', async () => {
    const content: TextTableContent = [
      [chunk('Service'), chunk('Status')],
      [chunk('api'), chunk('OK')],
    ]
    render(h(TextTable, { content }), test.renderer.root)
    await test.renderOnce()

    const table = mountedTable()
    expect(table).toBeInstanceOf(TextTableRenderable)
    expect(table.content).toBe(content)
    const frame = test.captureCharFrame()
    expect(frame).toContain('Service')
    expect(frame).toContain('api')
    // borders are on by default
    expect(frame).toContain('│')
  })

  it('forwards table options to the renderable', async () => {
    render(
      h(TextTable, {
        content: [[chunk('a')]],
        wrapMode: 'char',
        borderStyle: 'double',
        columnWidthMode: 'content',
        columnFitter: 'balanced',
        cellPadding: 2,
      }),
      test.renderer.root,
    )
    await test.renderOnce()

    const table = mountedTable()
    expect(table.wrapMode).toBe('char')
    expect(table.borderStyle).toBe('double')
    expect(table.columnWidthMode).toBe('content')
    expect(table.columnFitter).toBe('balanced')
    expect(table.cellPadding).toBe(2)
  })

  describe('boolean props', () => {
    it('keeps the renderable defaults when unset', async () => {
      render(h(TextTable, { content: [[chunk('a')]] }), test.renderer.root)
      await test.renderOnce()

      const table = mountedTable()
      expect(table.border).toBe(true)
      expect(table.outerBorder).toBe(true)
      expect(table.showBorders).toBe(true)
    })

    it('forwards explicit false values', async () => {
      render(
        h(TextTable, {
          content: [[chunk('a')]],
          border: false,
          outerBorder: false,
          showBorders: false,
        }),
        test.renderer.root,
      )
      await test.renderOnce()

      const table = mountedTable()
      expect(table.border).toBe(false)
      expect(table.outerBorder).toBe(false)
      expect(table.showBorders).toBe(false)
      expect(test.captureCharFrame()).not.toContain('│')
    })

    it('reads bare attributes as true', async () => {
      render(
        // bare attributes (`<TextTable border>`) arrive as empty strings
        h(TextTable, {
          content: [[chunk('a')]],
          border: '' as unknown as boolean,
          showBorders: '' as unknown as boolean,
        }),
        test.renderer.root,
      )
      await test.renderOnce()

      const table = mountedTable()
      expect(table.border).toBe(true)
      expect(table.showBorders).toBe(true)
    })
  })

  describe('declarative rows and cells', () => {
    it('builds the table content from TableRow/TableCell slots', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, null, () => [
            h(TableCell, null, () => 'Service'),
            h(TableCell, null, () => 'Status'),
          ]),
          h(TableRow, null, () => [
            h(TableCell, null, () => 'api'),
            h(TableCell, null, () => 'OK'),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      const table = mountedTable()
      expect(table.content).toHaveLength(2)
      expect(table.content[0]).toHaveLength(2)
      const frame = test.captureCharFrame()
      expect(frame).toContain('Service')
      expect(frame).toContain('api')
      expect(frame).toContain('OK')
    })

    it('applies cell style props as chunk styles', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, null, () => [
            h(TableCell, { bold: true }, () => 'Service'),
            h(TableCell, { fg: '#00d4aa' }, () => 'OK'),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      const [row] = mountedTable().content
      const boldChunk = row![0]![0]!
      expect(boldChunk.text).toBe('Service')
      expect(boldChunk.attributes! & TextAttributes.BOLD).toBe(TextAttributes.BOLD)
      const coloredChunk = row![1]![0]!
      expect(coloredChunk.fg).toEqual(parseColor('#00d4aa'))
    })

    it('cascades row style props to every cell', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, { bold: true, fg: '#ff0000' }, () => [
            h(TableCell, null, () => 'Service'),
            h(TableCell, null, () => 'Status'),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      const [row] = mountedTable().content
      for (const cellChunks of row!) {
        const chunk = cellChunks![0]!
        expect(chunk.attributes! & TextAttributes.BOLD).toBe(TextAttributes.BOLD)
        expect(chunk.fg).toEqual(parseColor('#ff0000'))
      }
    })

    it('lets cell style props win over row style props', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, { fg: '#ff0000', bold: true }, () => [
            h(TableCell, { fg: '#00ff00', italic: true }, () => 'OK'),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      const chunk = mountedTable().content[0]![0]![0]!
      // cell color wins, attributes merge
      expect(chunk.fg).toEqual(parseColor('#00ff00'))
      expect(chunk.attributes! & TextAttributes.BOLD).toBe(TextAttributes.BOLD)
      expect(chunk.attributes! & TextAttributes.ITALIC).toBe(TextAttributes.ITALIC)
    })

    it('keeps chunk-level styles over row and cell styles', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, { fg: '#ff0000' }, () => [
            h(TableCell, { fg: '#00ff00', content: fg('#0000ff')('chunk wins') }),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      expect(mountedTable().content[0]![0]![0]!.fg).toEqual(parseColor('#0000ff'))
    })

    it('accepts styled chunks through the cell content prop', async () => {
      render(
        h(TextTable, null, () => [
          h(TableRow, null, () => [h(TableCell, { content: fg('#b8a0ff')('DEGRADED') })]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()

      const cellChunks = mountedTable().content[0]![0]!
      expect(cellChunks[0]!.text).toBe('DEGRADED')
      expect(cellChunks[0]!.fg).toEqual(parseColor('#b8a0ff'))
      expect(test.captureCharFrame()).toContain('DEGRADED')
    })

    it('supports v-for style fragments of rows', async () => {
      const rows = ['one', 'two', 'three']
      render(
        h(TextTable, null, () =>
          rows.map((label) => h(TableRow, { key: label }, () => [h(TableCell, null, () => label)])),
        ),
        test.renderer.root,
      )
      await test.renderOnce()

      expect(mountedTable().content).toHaveLength(3)
      const frame = test.captureCharFrame()
      expect(frame).toContain('one')
      expect(frame).toContain('three')
    })

    it('updates the table when slot content changes', async () => {
      const status = ref('OK')
      render(
        h(TextTable, null, () => [
          h(TableRow, null, () => [
            h(TableCell, null, () => 'api'),
            h(TableCell, null, () => status.value),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()
      expect(test.captureCharFrame()).toContain('OK')

      status.value = 'DOWN'
      await nextTick()
      await test.renderOnce()
      expect(test.captureCharFrame()).toContain('DOWN')
    })

    it('keeps unchanged cell chunk references stable across re-renders', async () => {
      const status = ref('OK')
      render(
        h(TextTable, null, () => [
          h(TableRow, null, () => [
            h(TableCell, null, () => 'api'),
            h(TableCell, null, () => status.value),
          ]),
        ]),
        test.renderer.root,
      )
      await test.renderOnce()
      const before = mountedTable().content[0]![0]

      status.value = 'DOWN'
      await nextTick()
      await test.renderOnce()

      // the untouched cell keeps its identity so OpenTUI's cell diff skips it
      expect(mountedTable().content[0]![0]).toBe(before)
    })
  })
})
