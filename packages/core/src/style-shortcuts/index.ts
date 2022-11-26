import { extractorAttributify, isInSafelist } from './extractor'
import { aliases, specialAliases } from './alias'

function getAlias(key: string, value: string | boolean | number) {
  const isSpecial = specialAliases[`${key}-${value}`]
  if (isInSafelist(key)) {
    return { [key]: value }
  }
  if (isSpecial) {
    return isSpecial
  } else if (aliases[key]) {
    return { [aliases[key]]: value }
  }
}

export function transform(str: string) {
  const attrs = extractorAttributify(str)
  const result = Object.entries(attrs).reduce((pre, [key, value]) => {
    return {
      ...pre,
      ...getAlias(key, value),
    }
  }, {})
  return result
}
