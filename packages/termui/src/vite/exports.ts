import { ImportsMap } from 'unplugin-auto-import/types'

export const VueTuiExports: ImportsMap[string] = [
  // lifecycle
  'onActivated',
  'onBeforeMount',
  'onBeforeUnmount',
  'onBeforeUpdate',
  'onErrorCaptured',
  'onDeactivated',
  'onMounted',
  'onServerPrefetch',
  'onUnmounted',
  'onUpdated',

  // setup helpers
  'useAttrs',
  'useSlots',

  // reactivity,
  'computed',
  'customRef',
  'isReadonly',
  'isRef',
  'markRaw',
  'reactive',
  'readonly',
  'ref',
  'shallowReactive',
  'shallowReadonly',
  'shallowRef',
  'triggerRef',
  'toRaw',
  'toRef',
  'toRefs',
  'unref',
  'watch',
  'watchEffect',

  // component
  'defineComponent',
  'defineAsyncComponent',
  'getCurrentInstance',
  'h',
  'inject',
  'nextTick',
  'provide',
  // 'useCssModule',
  'createApp',

  // effect scope
  'effectScope',
  'EffectScope',
  'getCurrentScope',
  'onScopeDispose',

  // Vue 3 only
  'onRenderTracked',
  'onRenderTriggered',
  'resolveComponent',
  // 'useCssVars',

  // vue-termui API
  'useLog',
  'useRootNode',
  'useStdout',
  // components
  'TuiText',
  ['TuiText', 'Span'],
  'TuiNewline',
  ['TuiNewline', 'Br'],
  'TuiBox',
  ['TuiBox', 'Div'],
  ['TuiBox', 'Box'],
]
