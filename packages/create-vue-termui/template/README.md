# vue-termui-app

A terminal app built with [vue-termui](https://github.com/vue-terminal/vue-termui).

> [!IMPORTANT]
> vue-termui renders through [OpenTUI](https://opentui.com/)'s native engine, which requires FFI.
> Run with **Node ≥ 26.3** and `--experimental-ffi` (already wired into the scripts below), or use
> **[Bun](https://bun.sh/)**, which supports FFI natively.

```bash
pnpm install
pnpm dev
```

## Scripts

| Command      | Description          |
| ------------ | -------------------- |
| `pnpm dev`   | Run the app with HMR |
| `pnpm build` | Build to `dist/`     |
| `pnpm start` | Run the built app    |
