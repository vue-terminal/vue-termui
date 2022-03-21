import { h, FunctionalComponent } from '@vue/runtime-core'
import { Styles } from '../renderer/styles'

export interface TuiBoxProps extends Omit<Styles, 'textWrap'> {
  /**
   * Margin on all sides. Equivalent to setting `marginTop`, `marginBottom`, `marginLeft` and `marginRight`.
   *
   * @default 0
   */
  margin?: Number

  /**
   * Horizontal margin. Equivalent to setting `marginLeft` and `marginRight`.
   *
   * @default 0
   */
  marginX?: Number

  /**
   * Vertical margin. Equivalent to setting `marginTop` and `marginBottom`.
   *
   * @default 0
   */
  marginY?: Number

  /**
   * Padding on all sides. Equivalent to setting `paddingTop`, `paddingBottom`, `paddingLeft` and `paddingRight`.
   *
   * @default 0
   */
  padding?: Number

  /**
   * Horizontal padding. Equivalent to setting `paddingLeft` and `paddingRight`.
   *
   * @default 0
   */
  paddingX?: Number

  /**
   * Vertical padding. Equivalent to setting `paddingTop` and `paddingBottom`.
   *
   * @default 0
   */
  paddingY?: Number
}

export const TuiBox: FunctionalComponent<TuiBoxProps> = (
  props,
  { attrs, slots }
) => {
  return h(
    'tui:box',
    {
      style: {
        flexDirection: props.flexDirection ?? 'row',
        flexGrow: props.flexGrow ?? 0,
        flexShrink: props.flexShrink ?? 1,

        ...props,

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
