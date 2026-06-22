# vue-termui

Build terminal apps with Vue 3, rendered via [OpenTUI](https://opentui.com/).

Ground-up rewrite. The old implementation (custom renderer + yoga) lives in
`old/` and is being stripped out progressively.

## Commands

```bash
pnpm build                                 # build core with tsdown
pnpm test                                  # full suite: build + coverage + typecheck
pnpm test:cov                              # vitest with coverage
pnpm exec vitest run src/useHello.spec.ts  # single test file
pnpm lint                                  # oxlint
pnpm lint:fix                              # oxlint with auto-fix
pnpm test:types                            # tsc type checking
pnpm --filter playground dev               # run the playground (OpenTUI)
```

## Runtime

OpenTUI's native renderer is loaded over FFI. Creating a renderer
(`createCliRenderer`) requires **Node.js >= 26.3.0** with `--experimental-ffi`.
Plain imports of `@opentui/core` do not need FFI. The playground `dev` script
already passes `--experimental-ffi`.

## Important

Always keep this file up to date when project commands, structure, or tooling change.

## Architecture

- Root package `vue-termui` is the core library. `src/index.ts` re-exports from
  `src/*.ts`. Tests co-located as `*.spec.ts`; type tests as `*.test-d.ts`.
- `playground/` is a workspace package depending on the core via `workspace:*`.
- `old/` holds the previous monorepo, kept for reference while migrating.

Built with tsdown (`tsdown.config.ts`), outputs ESM to `dist/`. oxc toolchain:
oxlint for linting, oxfmt for formatting.
