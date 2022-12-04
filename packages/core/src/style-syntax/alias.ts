export const specialAliases: Record<string, Record<string, string>> = {
  //  Box Component
  'flex-row': { flexDirection: 'row' },
  'flex-row-reverse': { flexDirection: 'row-reverse' },
  'flex-col': { flexDirection: 'column' },
  'flex-col-reverse': { flexDirection: 'column-reverse' },
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  'items-center': { alignItems: 'center' },
  'items-stretch': { alignItems: 'stretch' },
  'self-start': { alignSelf: 'flex-start' },
  'self-end': { alignSelf: 'flex-end' },
  'self-center': { alignSelf: 'center' },
  'self-auto': { alignSelf: 'auto' },
  'justify-start': { justifyContent: 'flex-start' },
  'justify-end': { justifyContent: 'flex-end' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-around': { justifyContent: 'space-around' },
  'border-single': { borderStyle: 'single' },
  'border-double': { borderStyle: 'double' },
  'border-round': { borderStyle: 'round' },
  'border-bold': { borderStyle: 'bold' },
  'border-single-double': { borderStyle: 'singleDouble' },
  'border-double-single': { borderStyle: 'doubleSingle' },
  'border-classic': { borderStyle: 'classic' },
  'border-arrow': { borderStyle: 'arrow' },

  // Text Component
  'text-wrap': { wrap: 'wrap' },
  'text-end': { wrap: 'end' },
  'text-truncate': { wrap: 'truncate' },
  'text-truncate-end': { wrap: 'truncate-end' },
  'text-truncate-middle': { wrap: 'truncate-middle' },
  'text-truncate-start': { wrap: 'truncate-start' },
}

export const aliases: Record<string, string> = {
  // Box Component
  top: 'top',
  right: 'right',
  bottom: 'bottom',
  left: 'left',
  m: 'margin',
  mx: 'marginX',
  my: 'marginY',
  mt: 'marginTop',
  mr: 'marginRight',
  mb: 'marginBottom',
  ml: 'marginLeft',
  p: 'padding',
  px: 'paddingX',
  py: 'paddingY',
  pt: 'paddingTop',
  pr: 'paddingRight',
  pb: 'paddingBottom',
  pl: 'paddingLeft',
  grow: 'flexGrow',
  shrink: 'flexShrink',
  basis: 'flexBasis',
  w: 'width',
  'min-w': 'minWidth',
  'max-w': 'maxWidth',
  h: 'height',
  'min-h': 'minHeight',
  'max-h': 'maxHeight',
  border: 'borderColor',

  // Text Component
  bg: 'bgColor',
  text: 'color',
}

export function isInSpecialAliases(selector: string): boolean {
  return selector in specialAliases
}
