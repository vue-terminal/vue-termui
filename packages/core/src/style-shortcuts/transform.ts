import { specialAliases, isInSpecialAliases, aliases } from './alias'

function parseAttribute(attr: string) {
  let dashIndex = attr.indexOf('-')
  if (dashIndex < 0) {
    return [attr, true] as const
  } else {
    let identifier = attr.slice(0, dashIndex)
    if (identifier === 'min' || identifier === 'max') {
      dashIndex = attr.indexOf('-', dashIndex + 1)
      identifier = attr.slice(0, dashIndex)
    }

    return [identifier, attr.slice(dashIndex + 1)]
  }
}

function normalizeValue(value: string | boolean | number) {
  return !isNaN(+value) && typeof value !== 'boolean'
    ? +value
    : value
}

export function transformClassToStyleProps(classStr: string) {
  const props: Record<string, string | boolean | number> = {}

  for (const token of classStr.split(' ')) {
    if (isInSpecialAliases(token)) {
      Object.assign(props, specialAliases[token])
      continue
    }

    const [identifier, value] = parseAttribute(token)

    if (aliases[identifier]) {
      props[aliases[identifier]] = normalizeValue(value)
    } else {
      props[identifier] = normalizeValue(value)
    }
  }

  return props
}
