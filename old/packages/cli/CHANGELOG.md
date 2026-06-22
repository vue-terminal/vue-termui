## [0.0.17](https://github.com/vue-terminal/vue-termui/compare/@vue-termui/cli@0.0.14...@vue-termui/cli@0.0.17) (2022-11-06)

### Bug Fixes

- ci ([#12](https://github.com/vue-terminal/vue-termui/issues/12)) ([3c1d009](https://github.com/vue-terminal/vue-termui/commit/3c1d009a929cac0c786b0e31fd103824971489d1))
- clear screen when swapScreens is true ([5ef1f9e](https://github.com/vue-terminal/vue-termui/commit/5ef1f9eebced1b1bbda919639bec0d451fc96aa3))
- **focus:** correct traversal order ([5ce6381](https://github.com/vue-terminal/vue-termui/commit/5ce6381b1eb773685c187456d1cdcc44f281910e))

### Code Refactoring

- rewrite useStdout() ([7cfba52](https://github.com/vue-terminal/vue-termui/commit/7cfba5296a7728e2a5920ed85a41504c14f9c14c))

### Features

- allow passing auto import options ([7ab9a00](https://github.com/vue-terminal/vue-termui/commit/7ab9a001a61156264a480014ab8ccd734988b3b9))
- allow swapping screens for fullscreen apps ([71e0cdc](https://github.com/vue-terminal/vue-termui/commit/71e0cdcc161a7c5531e36da9b6441d2e26bff895))
- **box:** add basic title ([e5b488d](https://github.com/vue-terminal/vue-termui/commit/e5b488d6e7e18853e4ff5f2e9fa96742c87fcfd3))
- improve debug log ([98a4e50](https://github.com/vue-terminal/vue-termui/commit/98a4e50dc7ed1d24f1537cb44dc582cb5e07b651))
- useTitle ([a8b14ce](https://github.com/vue-terminal/vue-termui/commit/a8b14ce0c8b7aa3e31f1f963a650d672de261ef1))

### BREAKING CHANGES

- now it returns an object with `stdout` and a `write`
  method. `stdout` is just the stdout being used by the app while `write`
  lets you write to the output without messing up with the current output.
  Useful for debugging.

## [0.0.16](https://github.com/vue-terminal/vue-termui/compare/@vue-termui/cli@0.0.14...@vue-termui/cli@0.0.16) (2022-10-21)

### Bug Fixes

- ci ([#12](https://github.com/vue-terminal/vue-termui/issues/12)) ([3c1d009](https://github.com/vue-terminal/vue-termui/commit/3c1d009a929cac0c786b0e31fd103824971489d1))
- clear screen when swapScreens is true ([5ef1f9e](https://github.com/vue-terminal/vue-termui/commit/5ef1f9eebced1b1bbda919639bec0d451fc96aa3))
- **focus:** correct traversal order ([5ce6381](https://github.com/vue-terminal/vue-termui/commit/5ce6381b1eb773685c187456d1cdcc44f281910e))

### Code Refactoring

- rewrite useStdout() ([7cfba52](https://github.com/vue-terminal/vue-termui/commit/7cfba5296a7728e2a5920ed85a41504c14f9c14c))

### Features

- allow passing auto import options ([7ab9a00](https://github.com/vue-terminal/vue-termui/commit/7ab9a001a61156264a480014ab8ccd734988b3b9))
- allow swapping screens for fullscreen apps ([71e0cdc](https://github.com/vue-terminal/vue-termui/commit/71e0cdcc161a7c5531e36da9b6441d2e26bff895))
- **box:** add basic title ([e5b488d](https://github.com/vue-terminal/vue-termui/commit/e5b488d6e7e18853e4ff5f2e9fa96742c87fcfd3))
- improve debug log ([98a4e50](https://github.com/vue-terminal/vue-termui/commit/98a4e50dc7ed1d24f1537cb44dc582cb5e07b651))
- useTitle ([a8b14ce](https://github.com/vue-terminal/vue-termui/commit/a8b14ce0c8b7aa3e31f1f963a650d672de261ef1))

### BREAKING CHANGES

- now it returns an object with `stdout` and a `write`
  method. `stdout` is just the stdout being used by the app while `write`
  lets you write to the output without messing up with the current output.
  Useful for debugging.

## [0.0.15](https://github.com/vue-terminal/vue-termui/compare/@vue-termui/cli@0.0.14...@vue-termui/cli@0.0.15) (2022-10-21)

### Bug Fixes

- ci ([#12](https://github.com/vue-terminal/vue-termui/issues/12)) ([3c1d009](https://github.com/vue-terminal/vue-termui/commit/3c1d009a929cac0c786b0e31fd103824971489d1))
- clear screen when swapScreens is true ([5ef1f9e](https://github.com/vue-terminal/vue-termui/commit/5ef1f9eebced1b1bbda919639bec0d451fc96aa3))
- **focus:** correct traversal order ([5ce6381](https://github.com/vue-terminal/vue-termui/commit/5ce6381b1eb773685c187456d1cdcc44f281910e))

### Code Refactoring

- rewrite useStdout() ([7cfba52](https://github.com/vue-terminal/vue-termui/commit/7cfba5296a7728e2a5920ed85a41504c14f9c14c))

### Features

- allow passing auto import options ([7ab9a00](https://github.com/vue-terminal/vue-termui/commit/7ab9a001a61156264a480014ab8ccd734988b3b9))
- allow swapping screens for fullscreen apps ([71e0cdc](https://github.com/vue-terminal/vue-termui/commit/71e0cdcc161a7c5531e36da9b6441d2e26bff895))
- **box:** add basic title ([e5b488d](https://github.com/vue-terminal/vue-termui/commit/e5b488d6e7e18853e4ff5f2e9fa96742c87fcfd3))
- improve debug log ([98a4e50](https://github.com/vue-terminal/vue-termui/commit/98a4e50dc7ed1d24f1537cb44dc582cb5e07b651))
- useTitle ([a8b14ce](https://github.com/vue-terminal/vue-termui/commit/a8b14ce0c8b7aa3e31f1f963a650d672de261ef1))

### BREAKING CHANGES

- now it returns an object with `stdout` and a `write`
  method. `stdout` is just the stdout being used by the app while `write`
  lets you write to the output without messing up with the current output.
  Useful for debugging.

## [0.0.14](https://github.com/vue-terminal/vue-termui/compare/@vue-termui/cli@0.0.13...@vue-termui/cli@0.0.14) (2022-03-21)

### Bug Fixes

- exit app when done ([a1461db](https://github.com/vue-terminal/vue-termui/commit/a1461dbcfa6a2906e78cd5fed1bbdcc9c77d16f2))

### Features

- auto detect port ([8fd7f40](https://github.com/vue-terminal/vue-termui/commit/8fd7f409437582e8f3957535aa87e18176e09a42))
- focus management ([6198d1c](https://github.com/vue-terminal/vue-termui/commit/6198d1c84ccbfca1d734fe1e049fb16842bc8136))

## [0.0.13](https://github.com/vue-terminal/vue-termui/compare/@vue-termui/cli@0.0.12...@vue-termui/cli@0.0.13) (2022-03-15)

### Bug Fixes

- use production mode by default for better builds ([f37830b](https://github.com/vue-terminal/vue-termui/commit/f37830be17bdd87248203957d5204467c55a4478))

## 0.0.12 (2022-03-15)

### Bug Fixes

- deps and cli file ([0473999](https://github.com/vue-terminal/vue-termui/commit/04739996ede2b9d64a507a292ba813b7bafabe98))

### Features

- add link and text transform components ([654ee74](https://github.com/vue-terminal/vue-termui/commit/654ee74b15277c3913df630c7898826f0bd74d4c))
- add top, left, right, bottom ([5b73f16](https://github.com/vue-terminal/vue-termui/commit/5b73f16808577d19766a3c3cea2be68f7302a345))
- handle communication channel + ctrl-c on dev server ([ebb5ec7](https://github.com/vue-terminal/vue-termui/commit/ebb5ec72438dcf2f8e693ba9d16dd63672f834d5))
- handle multiple keys ([b48c8c0](https://github.com/vue-terminal/vue-termui/commit/b48c8c0a0af203151e7c858f292c7d1746281c0f))
- warn missing current instance ([77d24ca](https://github.com/vue-terminal/vue-termui/commit/77d24cae0db1d54a1c1c88547a8f6e8e9734dac1))
