/**
 * Debugs an escape code
 * @param c - char
 * @returns a display friendly ansi string
 */
function displayableChar(c: string) {
  const i = c.charCodeAt(0)
  if (
    // Ansi readable characters
    i >= 0x20 &&
    i <= 0x84 &&
    i !== 0x7f &&
    i !== 0x83
  ) {
    return c
  }

  if (i <= 0xff) {
    return `\\x${i.toString(16).padStart(2, '0')}`
  } else {
    return `\\u${i.toString(16).padStart(4, '0')}`
  }
}

/**
 * Converts a raw input with escapes codes into a printable representation of the string to debug.
 *
 * @param input - raw data from an `InputEvent`
 * @returns a printable representation of the data
 */
export function inputDataToString(input: string) {
  return input.split('').map(displayableChar).join('')
}
