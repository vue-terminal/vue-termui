import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

/**
 * Resolve an asset URL — produced by importing an asset with Vite
 * (`import src from './sound.wav?url'`, see
 * https://vite.dev/guide/assets#importing-asset-as-url) — to an absolute
 * filesystem path that Node and native APIs can read (here `@opentui/core`'s
 * audio engine, which takes a path, not a URL).
 *
 * The vue-termui plugin builds with a relative `base`, so in a build the import
 * compiles to `new URL('assets/x-<hash>.wav', import.meta.url).href` — a
 * `file://` URL sitting next to the emitted bundle, which `fileURLToPath` turns
 * into a path. In dev, Vite's SSR pipeline instead returns a server-root-relative
 * URL (`/src/assets/sounds/x.wav`); the dev server's root is the cwd, so we
 * resolve the path there.
 */
export function loadAsset(url: string): string {
  if (url.startsWith('file:')) return fileURLToPath(url)
  // Dev: `/src/…` relative to the Vite root (the cwd when running `vite`).
  // Drop any dev query/hash (`?t=`, `?v=`, …) before mapping to disk.
  return resolve(process.cwd(), url.replace(/[?#].*$/, '').replace(/^\/+/, ''))
}
