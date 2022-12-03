import { h, FunctionalComponent, computed } from '@vue/runtime-core'
import { Styles } from '../renderer/styles'
import { transformClassToStyleProps } from '../style-syntax '

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

export const TuiBox: FunctionalComponent<TuiBoxProps> = (props, { slots }) => {
  const propsWithClasses = computed(() =>
    props.class
      ? {
          ...props,
          ...transformClassToStyleProps(props.class),
        }
      : props
  )

  const propsValue = propsWithClasses.value

  return h(
    'tui:box',
    {
      style: {
        ...propsValue,
        display: propsValue.display ?? 'flex',
        flexDirection: propsValue.flexDirection ?? 'row',
        flexGrow: propsValue.flexGrow ?? 0,
        flexShrink: propsValue.flexShrink ?? 1,

        marginLeft:
          propsValue.marginLeft ?? propsValue.marginX ?? propsValue.margin ?? 0,
        marginRight:
          propsValue.marginRight ??
          propsValue.marginX ??
          propsValue.margin ??
          0,
        marginTop:
          propsValue.marginTop ?? propsValue.marginY ?? propsValue.margin ?? 0,
        marginBottom:
          propsValue.marginBottom ??
          propsValue.marginY ??
          propsValue.margin ??
          0,

        paddingLeft:
          propsValue.paddingLeft ??
          propsValue.paddingX ??
          propsValue.padding ??
          0,
        paddingRight:
          propsValue.paddingRight ??
          propsValue.paddingX ??
          propsValue.padding ??
          0,
        paddingTop:
          propsValue.paddingTop ??
          propsValue.paddingY ??
          propsValue.padding ??
          0,
        paddingBottom:
          propsValue.paddingBottom ??
          propsValue.paddingY ??
          propsValue.padding ??
          0,
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
