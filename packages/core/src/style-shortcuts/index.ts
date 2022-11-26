import { extractorAttributify } from './extractor'
import {
  aliases,
  isInSafelist,
  specialAliases,
  isInSpecialAliases,
} from './alias'

function getAlias(key: string, value: string | boolean | number) {
  if (isInSafelist(key)) {
    return { [key]: value }
  }
  if (isInSpecialAliases(key)) {
    return specialAliases[key]
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
