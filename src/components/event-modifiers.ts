/**
 * Separator the vue-termui SFC transform uses to encode `v-on` modifiers into a
 * renderable listener prop name (`@keyDown.ctrl.c` → `onKeyDown__ctrl__c`), and
 * that {@link resolveEventListeners} parses back out.
 *
 * Kept in its own dependency-free module so both sides can import it without
 * dragging in each other's heavy dependencies: the build-time transform lives in
 * `src/vite.ts` (which must not load the native `@opentui/core`), and the runtime
 * resolver lives in `./utils` (which must not pull `@vue/compiler-core` into the
 * app bundle). Chosen so it never collides with the camelCase TUI event names it
 * is appended to.
 *
 * @internal
 */
export const EVENT_MODIFIER_SEPARATOR = '__'
