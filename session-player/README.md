# session-player

A static web app that replays recorded **vue-termui** terminal sessions in the
browser with [xterm.js](https://xtermjs.org/). No server: OpenTUI's renderer is
native and can't run client-side, so instead we record the raw ANSI a real
terminal session emits and replay it here.

## How it works

1. **Record** a session from the terminal `playground/` (which runs real
   vue-termui apps) with [asciinema](https://asciinema.org/) — the standard
   terminal recorder. It captures the raw ANSI the session emits into an
   [asciicast v3](https://docs.asciinema.org/manual/asciicast/v3/) `.cast` file.
2. **Replay** here: `src/casts/*.cast` are auto-discovered, parsed, and streamed
   into xterm.js — a stateful VT parser, so replaying the output events in order
   reproduces the session exactly, colors and all.

## Record a session

Recordings must be asciicast v3, which is what asciinema (v3+,
`brew install asciinema`) writes by default:

```sh
pnpm --filter playground build # prod build: boots instantly, route comes from argv
asciinema rec --idle-time-limit 2 \
  -c "node --experimental-ffi --disable-warning=ExperimentalWarning playground/dist/main.js /text-styles" \
  session-player/src/casts/text-styles.cast
```

Drive the app in your terminal, then quit with `Ctrl+C`. The cast lands in
`src/casts/` and shows up in the player automatically. Casts embedded in the docs
live in `docs/public/casts/` instead, played by `<SessionPlayer src="…" />`.

Use the editor below the player to trim and resize a recording, then **Save
.cast** to download the edited copy (v3 again) and replace the original with it.

## Run the player

```sh
pnpm install        # from the repo root (session-player is a workspace package)
pnpm --filter session-player dev
```

Build the static site with `pnpm --filter session-player build`.
