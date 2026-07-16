# session-player

A static web app that replays recorded **vue-termui** terminal sessions in the
browser with [xterm.js](https://xtermjs.org/). No server: OpenTUI's renderer is
native and can't run client-side, so instead we record the raw ANSI a real
terminal session emits and replay it here.

## How it works

1. **Record** a session from the terminal `playground/` (which runs real
   vue-termui apps) with [asciinema](https://asciinema.org/) — the standard
   terminal recorder. It captures the raw ANSI the session emits into an
   [asciinema v2](https://docs.asciinema.org/manual/asciicast/v2/) `.cast` file.
2. **Replay** here: `src/casts/*.cast` are auto-discovered, parsed, and streamed
   into xterm.js — a stateful VT parser, so replaying the output events in order
   reproduces the session exactly, colors and all.

## Record a session

Requires asciinema (`brew install asciinema`). A helper wraps the invocation:

```sh
session-player/scripts/record.sh <name> [route]
# e.g.
session-player/scripts/record.sh styled-text /text-styles
```

Drive the app in your terminal, then quit with `Ctrl+C`. The cast lands in
`src/casts/<name>.cast` and shows up in the player automatically.

Under the hood it runs the playground's prod build under asciinema:

```sh
asciinema rec -f asciicast-v2 --idle-time-limit 2 \
  -c "node --experimental-ffi … playground/dist/main.js <route>" \
  src/casts/<name>.cast
```

`-f asciicast-v2` matters: v2 stores absolute timestamps, which the player
expects (v3 — asciinema's default — uses relative deltas).

## Run the player

```sh
pnpm install        # from the repo root (session-player is a workspace package)
pnpm --filter session-player dev
```

Build the static site with `pnpm --filter session-player build`.
