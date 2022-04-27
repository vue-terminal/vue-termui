## [0.0.9](https://github.com/posva-sponsors/vue-termui/compare/vite-plugin-vue-termui@0.0.8...vite-plugin-vue-termui@0.0.9) (2022-03-26)

### Code Refactoring

- rewrite useStdout() ([7cfba52](https://github.com/posva-sponsors/vue-termui/commit/7cfba5296a7728e2a5920ed85a41504c14f9c14c))

### BREAKING CHANGES

- now it returns an object with `stdout` and a `write`
  method. `stdout` is just the stdout being used by the app while `write`
  lets you write to the output without messing up with the current output.
  Useful for debugging.

## [0.0.8](https://github.com/posva-sponsors/vue-termui/compare/vite-plugin-vue-termui@0.0.7...vite-plugin-vue-termui@0.0.8) (2022-03-21)

### Bug Fixes

- exit app when done ([a1461db](https://github.com/posva-sponsors/vue-termui/commit/a1461dbcfa6a2906e78cd5fed1bbdcc9c77d16f2))

### Code Refactoring

- rename input properties to avoid collisions with dom ([3149bea](https://github.com/posva-sponsors/vue-termui/commit/3149beab70e378e20113cb84e44eff0aa16bfc68))

### BREAKING CHANGES

- all of the input events have been renamed to avoid
  collisions and errors with dom. All names containing Mouse are now named
  MouseData (to avoid collisions with MouseEvent and others) and to make
  things consistent, all Keypress and Keyboard are named KeyData. This is
  because to generate these events, we listen to the `data` event on the
  `stdin` and `Key` is shorter than `Keyboard`.

* `*Keypress*` -> `*KeyData*`
* `*Keyboard*` -> `*KeyData*`
* `*Mouse*` -> `*MouseData*`

## 0.0.7 (2022-03-15)

### Bug Fixes

- deps and cli file ([0473999](https://github.com/posva-sponsors/vue-termui/commit/04739996ede2b9d64a507a292ba813b7bafabe98))
- **vite:** change target and input ([493c62c](https://github.com/posva-sponsors/vue-termui/commit/493c62cbbd870858287b64315c3182d7963b279e))

### Features

- handle communication channel + ctrl-c on dev server ([ebb5ec7](https://github.com/posva-sponsors/vue-termui/commit/ebb5ec72438dcf2f8e693ba9d16dd63672f834d5))
- **vite:** vue must be included ([64c2161](https://github.com/posva-sponsors/vue-termui/commit/64c21618a99807b1b6194ce6d7f4b59e30affda7))
