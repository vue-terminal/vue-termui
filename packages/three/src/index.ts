// Color type used across ThreeCliRendererOptions (e.g. `backgroundColor`), so
// apps don't have to reach into @opentui/core (a private dependency).
export { RGBA } from '@opentui/core'

export { loadWebGPU, setupWebGPU } from './webgpu'
export type { WebGPUModule } from './webgpu'
export { registerBunFfiHooks } from './ffi/register'

export { CLICanvas } from './canvas'
export type { CLICanvasOptions } from './canvas'
export { asciiCharsFor, cellSizeFor, cycleRenderMode, resolveRenderMode } from './render-mode'
export type {
  AsciiModeOptions,
  AsciiStyle,
  GpuAlgorithm,
  GpuModeOptions,
  RenderMode,
  RenderModeName,
  RenderModeState,
} from './render-mode'
export { DEFAULT_ASCII_RAMP } from './shaders/ascii'
export { ASCII_SHAPE_CELL, asciiShapeShader, DEFAULT_ASCII_CONTRAST } from './shaders/ascii-shape'
export { DEFAULT_ASCII_CHARSET, GLYPH_COVERAGE } from './shaders/glyph-coverage'
export type { GlyphCoverage } from './shaders/glyph-coverage'
export { ThreeCliRenderer } from './WGPURenderer'
export type { ThreeCliRendererOptions } from './WGPURenderer'
export { ThreeRenderable } from './ThreeRenderable'
export type { ThreeRenderableOptions } from './ThreeRenderable'

export { Three } from './components/Three'
export type { ThreeProps } from './components/Three'
export { onFrame } from './composables/frame'

export { TextureUtils } from './TextureUtils'
export { SheetSprite, SpriteUtils } from './SpriteUtils'
export { InstanceManager, SpriteResourceManager } from './SpriteResourceManager'
export type { ResourceConfig, SpriteResource } from './SpriteResourceManager'
export { SpriteAnimator } from './animation/SpriteAnimator'
export type { AnimationDefinition, SpriteDefinition, TiledSprite } from './animation/SpriteAnimator'
export { SpriteParticleGenerator } from './animation/SpriteParticleGenerator'
export type { ParticleEffectParameters } from './animation/SpriteParticleGenerator'
