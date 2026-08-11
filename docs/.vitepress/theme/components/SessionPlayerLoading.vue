<template>
  <div class="session-player-loading">Loading player…</div>
</template>

<style scoped>
/* Mirrors the player's box so the swap-in isn't a jump, but faded back to read
   as a placeholder. */
.session-player-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 8rem;
  padding: 0.75rem;
  box-sizing: border-box;
  color: var(--player-fg, #bfbdb6);
  background: var(--player-bg, #0b0e14);
  border: 1px solid var(--player-border, #1c2230);
  border-radius: 8px;
  opacity: 0.6;
  font:
    13px/1 'JetBrains Mono',
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Consolas,
    monospace;
}
</style>
