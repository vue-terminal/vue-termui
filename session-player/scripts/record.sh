#!/usr/bin/env bash
# Record a vue-termui playground session to an asciinema v2 cast that the
# session-player replays. Requires asciinema (`brew install asciinema`).
#
# Usage: scripts/record.sh <name> [route]
#   scripts/record.sh dominos /demos/dominos
#
# Drive the app in your terminal, then quit with Ctrl+C — the cast lands in
# session-player/src/casts/<name>.cast and shows up in the player automatically.
set -euo pipefail

name="${1:?usage: record.sh <name> [route]}"
route="${2:-/}"

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)" # session-player/
root="$(cd "$here/.." && pwd)"                          # repo root
out="$here/src/casts/$name.cast"

command -v asciinema >/dev/null || {
  echo "asciinema not found — install it (e.g. brew install asciinema)" >&2
  exit 1
}

# Build the terminal playground bundle if it's missing. The prod build boots
# instantly (no vite) so the recording starts clean, and routes are selected via
# argv (prod bundles strip process.env).
[ -f "$root/playground/dist/main.js" ] || pnpm --filter playground build

# asciicast-v2 keeps absolute timestamps, which the player's parser expects
# (v3, asciinema's default, uses relative deltas). --idle-time-limit caps dead
# air so an interactive session doesn't produce a giant file.
asciinema rec -f asciicast-v2 --overwrite --idle-time-limit 2 \
  -c "node --experimental-ffi --disable-warning=ExperimentalWarning $root/playground/dist/main.js $route" \
  "$out"

echo "Saved $out"
