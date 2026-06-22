export const version = '0.0.0'

export { useHello } from './useHello'

// OpenTUI is the rendering backend. Re-export the primitives the playground
// needs so apps depend only on vue-termui.
export { createCliRenderer, Box, Text } from '@opentui/core'
