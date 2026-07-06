# Keybinding Best Practices

Your app is never the only program listening to the keyboard. A keypress travels through several layers before it reaches your handlers, and **any layer can consume it first**. Designing good keybindings for a TUI is mostly about understanding that stack and staying inside the set of keys you can actually rely on.

This page is about the _concepts and conventions_. For the vue-termui API — `onKeyDown`, `KeyEvent`, focus routing — see [Handling Input](./input) and [Focus Management](./focus).

## The input stack

An input event passes through a chain, and each stage may handle and swallow it before the next one sees it:

```
┌────────────┐   ┌──────────────────┐   ┌───────────────┐   ┌──────────────┐
│  OS / WM   │ → │ terminal emulator │ → │  multiplexer  │ → │   your app   │
│            │   │                   │   │  (tmux/screen)│   │              │
│ global     │   │ menu shortcuts,   │   │ prefix key,   │   │ only sees    │
│ shortcuts  │   │ selection, mouse  │   │ copy-mode,    │   │ what         │
│            │   │ protocol          │   │ its keytables │   │ survived     │
└────────────┘   └──────────────────┘   └───────────────┘   └──────────────┘
```

The multiplexer layer is optional (not everyone runs tmux), but the other three are always there. The practical consequence: **some key combinations will never reach your app**, no matter how you bind them, because something upstream claims them first.

## Why some keys never arrive

There are three separate reasons a combo might not make it to your handler.

### 1. It's a shortcut for an upper layer

The OS, the terminal emulator, and tmux all bind their own shortcuts, and those win. Common examples:

- **The OS / terminal app**: fullscreen, new tab/window, copy/paste, font size, tab switching — usually on the platform "command" modifier (<kbd>Cmd</kbd> on macOS, often <kbd>Ctrl</kbd>/<kbd>Ctrl+Shift</kbd> elsewhere).
- **tmux**: the prefix key (default <kbd>Ctrl+b</kbd>) plus whatever follows it, and everything in copy-mode.

These are user-configurable, but _you don't control them_ — so don't build core functionality on a combo the user's terminal is likely to eat.

### 2. Legacy terminal input can't encode it

The classic terminal input model predates modern keyboards: a key press is just a handful of bytes on a stream. Many combinations have no byte sequence of their own, so they either collapse into another key or vanish entirely:

| Can't be distinguished                                  | Because they send the same bytes                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| <kbd>Ctrl+I</kbd> and <kbd>Tab</kbd>                    | both `0x09`                                                                       |
| <kbd>Ctrl+M</kbd> and <kbd>Enter</kbd>                  | both `0x0D`                                                                       |
| <kbd>Ctrl+[</kbd> and <kbd>Esc</kbd>                    | both `0x1B`                                                                       |
| <kbd>Ctrl+H</kbd> and <kbd>Backspace</kbd>              | both `0x08` (on some terminals)                                                   |
| <kbd>Ctrl+letter</kbd> and <kbd>Ctrl+Shift+letter</kbd> | Shift is dropped when Ctrl is held                                                |
| <kbd>Esc</kbd> and <kbd>Alt</kbd>+_key_                 | Alt is encoded as an <kbd>Esc</kbd> prefix — telling them apart is a timing guess |

And some things are simply _not there_ in the legacy model:

- The platform "command" modifier (<kbd>Cmd</kbd> / <kbd>Super</kbd> / <kbd>Win</kbd>) has **no encoding at all** — even if no upper layer grabbed it, the terminal has no bytes to send. <kbd>Cmd+Enter</kbd> doesn't exist as a key event.
- **Key releases aren't reported.** The stream only carries presses, so "hold to act" interactions can't be built on legacy input.

### 3. Decades of muscle memory already claim it

A few combos have long-standing, load-bearing meanings. In a canonical (cooked-mode) shell the TTY itself turns them into signals; a raw-mode TUI like yours receives most of them as **ordinary key events** instead. That does _not_ free them up — the meaning lives in your users' reflexes:

| Input                                 | Users expect                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| <kbd>Ctrl+C</kbd>                     | Interrupt — in raw mode it reaches the app as a key event, so honoring it is the app's job (see below) |
| <kbd>Ctrl+Z</kbd>                     | Suspend to the shell                                                                                   |
| <kbd>Ctrl+D</kbd>                     | End-of-file / "I'm done here"                                                                          |
| <kbd>Ctrl+S</kbd> / <kbd>Ctrl+Q</kbd> | Flow control (XOFF/XON) — on some setups <kbd>Ctrl+S</kbd> still _freezes_ the terminal                |
| <kbd>Ctrl+\\</kbd>                    | Quit (SIGQUIT)                                                                                         |
| <kbd>Shift</kbd>+click                | Manual text selection — terminals reserve Shift to override mouse reporting so users can still copy    |

<kbd>Shift</kbd>+click deserves a special note: when your app enables mouse reporting, the terminal normally forwards clicks to you — **except** while Shift is held, which is deliberately reserved so users can select and copy text. This is a convention people rely on; don't try to reclaim it.

::: warning Ctrl+C is a contract, not a suggestion
Because a raw-mode TUI intercepts <kbd>Ctrl+C</kbd> instead of dying to SIGINT, keeping it working is the app's responsibility. OpenTUI upholds the contract for you: by default the renderer exits when it sees <kbd>Ctrl+C</kbd> (the `exitOnCtrlC` renderer option). If you turn that off — say, to confirm before quitting or run custom teardown — you _must_ provide another way out, or your app becomes unquittable by the one key everyone tries first.
:::

## Getting more keys: the Kitty keyboard protocol

Modern terminals implement the **Kitty keyboard protocol**, which fixes most of the legacy limitations:

- It disambiguates the collisions above (<kbd>Ctrl+I</kbd> ≠ <kbd>Tab</kbd>, Shift survives alongside Ctrl, no more <kbd>Esc</kbd>-vs-<kbd>Alt</kbd> guessing).
- It can report **key releases** and repeats, not just presses.
- It adds the missing modifiers — including <kbd>Super</kbd>/<kbd>Cmd</kbd> — so combos like <kbd>Cmd+Enter</kbd> can finally reach your app.

**You don't need to enable anything for the basics**: OpenTUI requests the protocol's disambiguation and alternate-keys enhancements by default on every start, and terminals that don't support it simply ignore the request. Key releases are the exception — the protocol's _report event types_ enhancement is off by default, so [`onKeyUp`](./input#key-releases) requires opting in through the renderer config's `useKittyKeyboard` object:

```ts
// main.ts
const app = await createApp(App, null, {
  useKittyKeyboard: {
    // disambiguate: true,   (default)
    // alternateKeys: true,  (default)
    events: true, // report press/repeat/release → onKeyUp works
  },
})
```

Two caveats worth internalizing:

- **Support isn't universal.** Kitty, WezTerm, Ghostty, foot, Alacritty, recent iTerm2 and the VS Code terminal support it; older/simpler terminals don't. tmux forwards the encoded keys but doesn't implement the full protocol. On unsupported setups you silently fall back to legacy behavior.
- **It doesn't override upper layers.** If the terminal still binds <kbd>Cmd+Enter</kbd> to fullscreen, that shortcut wins before the protocol ever encodes the key. The user has to free the binding in their terminal first.

::: tip Treat enhanced keys as a bonus, not a requirement
Because support varies, never make a _core_ action reachable **only** through a Kitty-only combo (a <kbd>Super</kbd> chord, a key-release, a disambiguated <kbd>Ctrl+I</kbd>). Use them to _enhance_, and always provide a legacy-safe fallback.
:::

## Choosing good keybindings

The reliable core is smaller than a keyboard suggests, but it's plenty: **letters, digits, arrows, <kbd>Enter</kbd>, <kbd>Esc</kbd>, <kbd>Tab</kbd>, <kbd>Space</kbd>, <kbd>Backspace</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>/<kbd>PgUp</kbd>/<kbd>PgDn</kbd>, function keys, and most single <kbd>Ctrl</kbd>+letter combos** (minus the reserved ones above). Within that set, lean on the vocabulary users already know:

| Key                                                         | Established meaning  |
| ----------------------------------------------------------- | -------------------- |
| <kbd>q</kbd>, <kbd>Ctrl+C</kbd>                             | quit                 |
| <kbd>?</kbd>                                                | help                 |
| <kbd>/</kbd>                                                | search / filter      |
| arrows, <kbd>h</kbd> <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd> | move                 |
| <kbd>Enter</kbd>                                            | confirm / open       |
| <kbd>Esc</kbd>                                              | cancel / back        |
| <kbd>Tab</kbd>                                              | next field or pane   |
| <kbd>Space</kbd>                                            | toggle / select      |
| <kbd>g</kbd> / <kbd>G</kbd>                                 | jump to top / bottom |

Beyond conventions:

- **Don't depend on distinctions the terminal can't make** unless Kitty is on: <kbd>Ctrl+I</kbd> vs <kbd>Tab</kbd>, <kbd>Shift</kbd> combined with <kbd>Ctrl</kbd>, <kbd>Esc</kbd> vs <kbd>Alt</kbd> chords.
- **Use a leader key for large command sets** — one namespace key followed by a letter scales much further than exotic chords, and it's how tmux, vim and helix users already think.
- **Make bindings discoverable.** A persistent hint bar or a <kbd>?</kbd> overlay listing active keys turns your keymap from trivia into UI. A keybinding nobody can find is a keybinding nobody uses.
- **Scope keys with focus.** Route typing to the focused widget and keep global shortcuts (quit, help) at the top level — see [Focus Management](./focus). Call [`key.preventDefault()`](./input#the-keyevent) when a widget consumes a key so global handlers don't also react.
- **Test on more than one terminal**, ideally with and without tmux, before committing to a binding.

### A leader key with a hint bar

The two ideas reinforce each other: while the leader is pending, the hint bar becomes the menu of what can follow. All of it is plain state plus [`onKeyDown`](./input#keyboard):

```vue
<script setup lang="ts">
import { onKeyDown, ref, useExit } from 'vue-termui'

const exit = useExit()
const leader = ref(false)

onKeyDown((key) => {
  if (leader.value) {
    leader.value = false
    if (key.name === 's') save()
    else if (key.name === 'r') rename()
    else if (key.name === 'x') remove()
    return // unknown follow-up: leader silently cancels
  }
  if (key.name === 'g') leader.value = true
  else if (key.name === 'q' || (key.ctrl && key.name === 'c')) exit()
})
</script>

<template>
  <MainView />
  <Text dim>
    {{
      leader
        ? 'g +  s save · r rename · x delete · any other key cancels'
        : 'q quit · ? help · g commands'
    }}
  </Text>
</template>
```

## Debugging what actually reaches your app

When a binding "doesn't work," first find out whether the key even reaches the process — the problem is often an upper layer.

- **Inspect the raw bytes.** Run `cat -v` (or `sed -n l`) in the same terminal and press the combo. If you see an escape sequence, your app can receive it; if you see _nothing_, something upstream trapped it. `showkey -a` works on Linux too.
- **Show the `KeyEvent` in your UI.** Every event carries the raw `sequence` plus the parsed `name` and modifier booleans. Rendering the last event beats logging — stdout is busy drawing your app:

  ```vue
  <script setup lang="ts">
  import { onKeyDown, ref } from 'vue-termui'

  const last = ref('press something…')

  onKeyDown((key) => {
    const mods = [
      key.ctrl && 'ctrl',
      key.option && 'option',
      key.shift && 'shift',
      key.meta && 'meta',
    ]
      .filter(Boolean)
      .join('+')
    last.value = `${mods && mods + '+'}${key.name}  seq=${JSON.stringify(key.sequence)}  (${key.eventType})`
  })
  </script>

  <template>
    <Text>{{ last }}</Text>
  </template>
  ```

- **Check the upper layers' config** when a key never arrives: your terminal's shortcut/keybinding preferences, `tmux list-keys`, and your OS keyboard settings each enumerate what that layer claims.

::: info No universal "trapped keys" list
There's no single API that reports every shortcut the OS, terminal, and tmux have claimed — the state is spread across each layer's own configuration. The raw-byte check above is the fastest way to answer "can my app even see this key?" for a specific combo on a specific setup.
:::
