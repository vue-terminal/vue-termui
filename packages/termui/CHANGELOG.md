## [0.0.11](https://github.com/posva/vue-termui/compare/vue-termui@0.0.10...vue-termui@0.0.11) (2022-03-26)

### Bug Fixes

- **focus:** pass disabled ref to useFocus ([b42248c](https://github.com/posva/vue-termui/commit/b42248c8ef59da21a33db876bdeaf615d76be4df))

### Code Refactoring

- rewrite useStdout() ([7cfba52](https://github.com/posva/vue-termui/commit/7cfba5296a7728e2a5920ed85a41504c14f9c14c))

### Features

- allow swapping screens for fullscreen apps ([71e0cdc](https://github.com/posva/vue-termui/commit/71e0cdcc161a7c5531e36da9b6441d2e26bff895))
- **box:** add basic title ([e5b488d](https://github.com/posva/vue-termui/commit/e5b488d6e7e18853e4ff5f2e9fa96742c87fcfd3))
- useTitle ([a8b14ce](https://github.com/posva/vue-termui/commit/a8b14ce0c8b7aa3e31f1f963a650d672de261ef1))

### BREAKING CHANGES

- now it returns an object with `stdout` and a `write`
  method. `stdout` is just the stdout being used by the app while `write`
  lets you write to the output without messing up with the current output.
  Useful for debugging.

## [0.0.10](https://github.com/posva/vue-termui/compare/vue-termui@0.0.9...vue-termui@0.0.10) (2022-03-21)

### Bug Fixes

- exit app when done ([a1461db](https://github.com/posva/vue-termui/commit/a1461dbcfa6a2906e78cd5fed1bbdcc9c77d16f2))

### Code Refactoring

- rename input properties to avoid collisions with dom ([3149bea](https://github.com/posva/vue-termui/commit/3149beab70e378e20113cb84e44eff0aa16bfc68))

### Features

- add handling of onInput ([e28bfe4](https://github.com/posva/vue-termui/commit/e28bfe464ac80e67d00200a19c1105867179a72c))
- auto detect port ([8fd7f40](https://github.com/posva/vue-termui/commit/8fd7f409437582e8f3957535aa87e18176e09a42))
- **components:** wip input ([e8a5940](https://github.com/posva/vue-termui/commit/e8a59409043058b115d9e39f24240f894e7251b2))
- focus management ([6198d1c](https://github.com/posva/vue-termui/commit/6198d1c84ccbfca1d734fe1e049fb16842bc8136))
- onInput emits raw data ([d693db4](https://github.com/posva/vue-termui/commit/d693db4ca295babc9bcf9ce9b8a34d9c51cb9ad9))
- wip focus handler ([da25da2](https://github.com/posva/vue-termui/commit/da25da2c2cf442d5a5aadc0d1e587a14ae60ce82))

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

- onInput emits a single raw data now

## [0.0.9](https://github.com/posva/vue-termui/compare/vue-termui@0.0.8...vue-termui@0.0.9) (2022-03-15)

### Bug Fixes

- types in package.json ([c78adf6](https://github.com/posva/vue-termui/commit/c78adf611c2a920823af6e2648ac6ddf34d169c0))

## [0.0.8](https://github.com/posva/vue-termui/compare/vue-termui@0.0.7...vue-termui@0.0.8) (2022-03-15)

### Bug Fixes

- typo in cursor sequence ([2677417](https://github.com/posva/vue-termui/commit/2677417da969db6a4e7231f9ce98f0a4909bfd4c))
- use production mode by default for better builds ([f37830b](https://github.com/posva/vue-termui/commit/f37830be17bdd87248203957d5204467c55a4478))

## 0.0.7 (2022-03-15)

### Bug Fixes

- add base function keys ([ea21f0b](https://github.com/posva/vue-termui/commit/ea21f0be4a226cf8e82889b9d318c75e7914e9cf))
- make playground work ([65d96db](https://github.com/posva/vue-termui/commit/65d96db3a57debe0d0b8e30fff9d48f02d50db82))
- text computation ([c8eda3f](https://github.com/posva/vue-termui/commit/c8eda3ffc2761ec0b2fbd4720833099a2af20b05))
- type ([7391160](https://github.com/posva/vue-termui/commit/739116056780b43be17f92824ff4eede43e5aaa7))

### Features

- add clone node op ([7360c1d](https://github.com/posva/vue-termui/commit/7360c1d2c620df74cabf01de89ba020c3071840d))
- add exitApp ([7ce4e67](https://github.com/posva/vue-termui/commit/7ce4e67eebdcc80b3514db7a072ee7615045d879))
- add link and text transform components ([654ee74](https://github.com/posva/vue-termui/commit/654ee74b15277c3913df630c7898826f0bd74d4c))
- add top, left, right, bottom ([5b73f16](https://github.com/posva/vue-termui/commit/5b73f16808577d19766a3c3cea2be68f7302a345))
- handle communication channel + ctrl-c on dev server ([ebb5ec7](https://github.com/posva/vue-termui/commit/ebb5ec72438dcf2f8e693ba9d16dd63672f834d5))
- handle multiple keys ([b48c8c0](https://github.com/posva/vue-termui/commit/b48c8c0a0af203151e7c858f292c7d1746281c0f))
- make signal exit browser compatible ([ae34c2c](https://github.com/posva/vue-termui/commit/ae34c2c786a6ea63a22fe1867b2f89b272f272cb))
- warn missing current instance ([77d24ca](https://github.com/posva/vue-termui/commit/77d24cae0db1d54a1c1c88547a8f6e8e9734dac1))
