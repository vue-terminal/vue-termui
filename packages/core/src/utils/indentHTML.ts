/*

<tui:box>
<tui:box>
<tui:text>
<#text>TODO: logs</>
</tui:text>
</tui:box>
<tui:box>
<#text></>
<tui:text>
<tui:virtual-text>
<#text>🁰</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁫</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁬</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁨</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁭</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁧</>
</tui:virtual-text>
<#text> </>
</tui:text>
<tui:text>
<tui:virtual-text>
<#text>🁼</>
</tui:virtual-text>
<#text> </>
</tui:text>
<#text></>
</tui:box>
</tui:box>

*/

const INDENT = '  '

/**
 * Indent unindented HTML to read better
 *
 * @param html - html to indent
 * @returns an indented HTML
 */
export function indentHTML(html: string): string {
  let indent = 0
  let isOpen = false

  return html.split('\n').reduce((result, line) => {
    // if (line.includes('virtual-text')) {
    //   console.log({ indent, result, line })
    // }
    // closing a tag
    if (line.startsWith('</')) {
      indent--
      // last line was just text
      if (!result.endsWith('>') && isOpen) {
        isOpen = false
        return result + line
      }
      isOpen = false
      return result + '\n' + INDENT.repeat(indent) + line
    }

    if (line.startsWith('<')) {
      const currentIndent = indent
      if (!line.startsWith('<!--')) {
        indent++
        isOpen = true
      }
      return result + (result ? '\n' : '') + INDENT.repeat(currentIndent) + line
    }
    return result + line
  }, '')
}
