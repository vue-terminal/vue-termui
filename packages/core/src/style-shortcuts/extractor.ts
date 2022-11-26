import { isInSafelist, isInSpecialAliases } from './alias'
const defaultSplitRE = /\\?[\s'"`;{}]+/g
const attributifyRE = /([\w\-]+)-([a-zA-Z0-9\%]+)$/

function isValidSelector(selector = ''): selector is string {
  return attributifyRE.test(selector)
}

export const extractorAttributify = (code: string) => {
  const result: Record<string, string | boolean | number> = {}

  code.split(defaultSplitRE).forEach((content) => {
    if (isInSafelist(content)) {
      result[content] = true
    } else if (isInSpecialAliases(content)) {
      result[content] = content
    } else if (isValidSelector(content)) {
      const [_, key, value] = content.match(attributifyRE)!
      result[key] = !isNaN(value as unknown as number) ? +value : value
    }
  })

  return result
}
