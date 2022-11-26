import { h, FunctionalComponent } from '@vue/runtime-core'
import { Styles } from '../renderer/styles'
import { transform } from '../style-shortcuts'

export interface TuiBoxProps extends Omit<Styles, 'textWrap'> {
  /**
   * Margin on all sides. Equivalent to setting `marginTop`, `marginBottom`, `marginLeft` and `marginRight`.
   *
   * @default 0
   */
  margin?: number

  /**
   * Horizontal margin. Equivalent to setting `marginLeft` and `marginRight`.
   *
   * @default 0
   */
  marginX?: number

  /**
   * Vertical margin. Equivalent to setting `marginTop` and `marginBottom`.
   *
   * @default 0
   */
  marginY?: number

  /**
   * Padding on all sides. Equivalent to setting `paddingTop`, `paddingBottom`, `paddingLeft` and `paddingRight`.
   *
   * @default 0
   */
  padding?: number

  /**
   * Horizontal padding. Equivalent to setting `paddingLeft` and `paddingRight`.
   *
   * @default 0
   */
  paddingX?: number

  /**
   * Vertical padding. Equivalent to setting `paddingTop` and `paddingBottom`.
   *
   * @default 0
   */
  paddingY?: number

  /**
   * Optional title to display.
   */
  title?: string

  /**
   * Style shortcuts.
   */
  class?: string
}

export const TuiBox: FunctionalComponent<TuiBoxProps> = (
  props,
  { slots, attrs }
) => {
  ;(props.class || Object.keys(attrs).length) &&
    (props = {
      ...props,
      ...(props.class && transform(props.class)),
      ...(Object.keys(attrs).length && transform(Object.keys(attrs).join(' '))),
    })

  return h(
    'tui:box',
    {
      style: {
        ...props,

        display: props.display ?? 'flex',
        flexDirection: props.flexDirection ?? 'row',
        flexGrow: props.flexGrow ?? 0,
        flexShrink: props.flexShrink ?? 1,

        marginLeft: props.marginLeft ?? props.marginX ?? props.margin ?? 0,
        marginRight: props.marginRight ?? props.marginX ?? props.margin ?? 0,
        marginTop: props.marginTop ?? props.marginY ?? props.margin ?? 0,
        marginBottom: props.marginBottom ?? props.marginY ?? props.margin ?? 0,

        paddingLeft: props.paddingLeft ?? props.paddingX ?? props.padding ?? 0,
        paddingRight:
          props.paddingRight ?? props.paddingX ?? props.padding ?? 0,
        paddingTop: props.paddingTop ?? props.paddingY ?? props.padding ?? 0,
        paddingBottom:
          props.paddingBottom ?? props.paddingY ?? props.padding ?? 0,
      },
    },
    { default: slots.default }
  )
}

TuiBox.displayName = 'TuiBox'
TuiBox.props = [
  'title',
  'class',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'margin',
  'marginX',
  'marginY',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'padding',
  'paddingX',
  'paddingY',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'flexGrow',
  'flexShrink',
  'flexDirection',
  'flexBasis',
  'alignItems',
  'alignSelf',
  'justifyContent',
  'width',
  'height',
  'minWidth',
  'minHeight',
  'maxWidth',
  'maxHeight',
  'display',
  'borderStyle',
  'borderColor',
]
