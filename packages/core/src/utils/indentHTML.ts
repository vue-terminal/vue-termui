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

  return html.split('\n').reduce((result, line) => {
    // if (line.includes('virtual-text')) {
    //   console.log({ indent, result, line })
    // }
    // closing a tag
    if (line.startsWith('</')) {
      indent--
      // last line was just text
      if (!result.trimEnd().endsWith('>')) {
        return result + line
      }
      return result + '\n' + INDENT.repeat(indent) + line
    }

    if (line.startsWith('<')) {
      return result + (result ? '\n' : '') + INDENT.repeat(indent++) + line
    }
    return result + line
  }, '')
}
