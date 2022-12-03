import { h, FunctionalComponent, computed } from '@vue/runtime-core'
import { Styles } from '../renderer/styles'
import { transformClassToStyleProps } from '../style-shortcuts'

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

  return h(
    'tui:box',
    {
      style: {
        ...propsWithClasses.value,
        display: propsWithClasses.value.display ?? 'flex',
        flexDirection: propsWithClasses.value.flexDirection ?? 'row',
        flexGrow: propsWithClasses.value.flexGrow ?? 0,
        flexShrink: propsWithClasses.value.flexShrink ?? 1,

        marginLeft:
          propsWithClasses.value.marginLeft ??
          propsWithClasses.value.marginX ??
          propsWithClasses.value.margin ??
          0,
        marginRight:
          propsWithClasses.value.marginRight ??
          propsWithClasses.value.marginX ??
          propsWithClasses.value.margin ??
          0,
        marginTop:
          propsWithClasses.value.marginTop ??
          propsWithClasses.value.marginY ??
          propsWithClasses.value.margin ??
          0,
        marginBottom:
          propsWithClasses.value.marginBottom ??
          propsWithClasses.value.marginY ??
          propsWithClasses.value.margin ??
          0,

        paddingLeft:
          propsWithClasses.value.paddingLeft ??
          propsWithClasses.value.paddingX ??
          propsWithClasses.value.padding ??
          0,
        paddingRight:
          propsWithClasses.value.paddingRight ??
          propsWithClasses.value.paddingX ??
          propsWithClasses.value.padding ??
          0,
        paddingTop:
          propsWithClasses.value.paddingTop ??
          propsWithClasses.value.paddingY ??
          propsWithClasses.value.padding ??
          0,
        paddingBottom:
          propsWithClasses.value.paddingBottom ??
          propsWithClasses.value.paddingY ??
          propsWithClasses.value.padding ??
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
