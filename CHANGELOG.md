# [0.2.0](https://github.com/vue-terminal/vue-termui/compare/v0.1.0...v0.2.0) (2026-07-09)

### Bug Fixes

- box border ([a816e2b](https://github.com/vue-terminal/vue-termui/commit/a816e2bc439fcd1a1516873991d35570468f2375))
- **events:** don't crash when a modifier is used on a lifecycle emit ([d420904](https://github.com/vue-terminal/vue-termui/commit/d42090423428a6918ca375da156b9b21096ef45c))
- **vite:** resolve built asset URLs relative to the bundle ([#57](https://github.com/vue-terminal/vue-termui/issues/57)) ([bdc47d5](https://github.com/vue-terminal/vue-termui/commit/bdc47d524deb2a99a6401d8573c2752c846e2093))

### Code Refactoring

- namespace host tags under tui- ([bf8fb8b](https://github.com/vue-terminal/vue-termui/commit/bf8fb8bfac753cd26e88a2c9782bc594ca15d1a6))

### Features

- add ScrollBox component ([f79d396](https://github.com/vue-terminal/vue-termui/commit/f79d396beb1963c185efcae591f33c3a1480ac6e))
- add TabSelect component ([ac1f643](https://github.com/vue-terminal/vue-termui/commit/ac1f643e3b36c9b824f5fb84a020694aaa82232a))
- **Box:** apply event modifiers to renderable listeners ([3c8d815](https://github.com/vue-terminal/vue-termui/commit/3c8d8157f1dc72e1a52cb8d055f3d750745cac8e))
- **components:** apply event modifiers across renderable components ([8dc6932](https://github.com/vue-terminal/vue-termui/commit/8dc69326f3c4416f1448a04e5f26ef68a7d55f65))
- error on nested Text ([4f0b869](https://github.com/vue-terminal/vue-termui/commit/4f0b8690cd8f8dfeda0b616af356ecbc6f806396))
- externalize more to apply build-time improvements ([9cb4cb2](https://github.com/vue-terminal/vue-termui/commit/9cb4cb275bef858a6c727cd82bf7464d06ced721))
- **utils:** add TUI event-modifier resolver ([75546cd](https://github.com/vue-terminal/vue-termui/commit/75546cd975eac8a0b071373384581fa6dc72bcd0))
- **vite:** encode v-on modifiers for terminal events ([43c9830](https://github.com/vue-terminal/vue-termui/commit/43c983026c236dcd1f1075b4a9cf77881b424ef1))

### Performance Improvements

- simpler synthenic events ([da896c9](https://github.com/vue-terminal/vue-termui/commit/da896c9a3928165b688958b8f4ae5d2bdf763706))

### BREAKING CHANGES

- host tags are now prefixed with `tui-` (e.g. `<box>` → `<tui-box>`).

# 0.1.0 (2026-07-03)

- feat(markdown)!: require syntaxStyle prop ([c4f294a](https://github.com/vue-terminal/vue-termui/commit/c4f294ac1dd9958cd1bf1d6a74cebf887118d25e))

### Bug Fixes

- destruction of nodes ([6a065e1](https://github.com/vue-terminal/vue-termui/commit/6a065e1294a6778c63cf268ad4f38ed66b17fe2d))
- **dev:** exit on the first Ctrl+C ([75eeda2](https://github.com/vue-terminal/vue-termui/commit/75eeda265b57fbe7c9fac9a086d81a4cf7cf34ef))
- disable attr fallthrough on renderable components ([04c8a4d](https://github.com/vue-terminal/vue-termui/commit/04c8a4d51ad924ed232a55ab8c32c5d0e97df9ba))
- **focus:** return a function template ref from useFocus ([019a8de](https://github.com/vue-terminal/vue-termui/commit/019a8def005214d097e1ad713cd9cef3db06b866))
- **hmr:** work on initial as well ([0013009](https://github.com/vue-terminal/vue-termui/commit/0013009890eb86a8803f80d3045638956e5fd270))
- honor focusedBorderColor in box ([c6e3df3](https://github.com/vue-terminal/vue-termui/commit/c6e3df3518d857cbdf10ad50af6b4f480d3d8935))
- multiplex renderer event listeners to avoid EventEmitter leak warning ([096dea9](https://github.com/vue-terminal/vue-termui/commit/096dea951a2cdb2ce285f9fec1a354847083ba01))
- no double inherit ([ff06b19](https://github.com/vue-terminal/vue-termui/commit/ff06b19a13723e60bb4113a794c68e429d46c326))
- pass down and type Box and Text props ([cf8ab67](https://github.com/vue-terminal/vue-termui/commit/cf8ab670bc45fdb1e61f7ea28f4f95143da847f1))
- pass down undefined when possible ([600ebc7](https://github.com/vue-terminal/vue-termui/commit/600ebc7fa487493e4c2227ed9a7e9818651652ba))
- **renderer:** support text nodes / Fragment anchors in layout containers ([8a4833d](https://github.com/vue-terminal/vue-termui/commit/8a4833d448a80163f928d03b12119095dac9e735))
- rendering timing ([219090e](https://github.com/vue-terminal/vue-termui/commit/219090ea288c6b8a71b31df46b9acddf0e3b6fd9))
- **test:** satisfy isolatedDeclarations/noUncheckedIndexedAccess in hmr spec ([60b7e80](https://github.com/vue-terminal/vue-termui/commit/60b7e800587c52b0948e0c1d7873603e0c27072a))
- types ([ac3c500](https://github.com/vue-terminal/vue-termui/commit/ac3c5008a934af760a3c45e0cb802bcbdb69649e))

### Features

- add Markdown ([9ad801d](https://github.com/vue-terminal/vue-termui/commit/9ad801dd52b62a6e741bd6deb0a5cd397fdf7184))
- add vue-termui/vite plugin for turnkey terminal app builds ([8e4fb91](https://github.com/vue-terminal/vue-termui/commit/8e4fb910fe8df57ebe206900d7b69fdaee66d0d3))
- **app:** add waitUntilExit(), exit() and useExit() ([feb1933](https://github.com/vue-terminal/vue-termui/commit/feb193355e88508ce3716be784918d10b76e813a))
- **components:** add Box, Text and Newline components ([2c62004](https://github.com/vue-terminal/vue-termui/commit/2c62004ca1967958bdf371ee73b8d5f960f4a00c))
- **components:** add Input, Select and ProgressBar with v-model ([0256f63](https://github.com/vue-terminal/vue-termui/commit/0256f6344bdc2b53ed4d3a7b6e49b7e079e62ee6))
- **composables:** add onKeyDown/onKeyUp keyboard composables ([c08300a](https://github.com/vue-terminal/vue-termui/commit/c08300a0b74e44040ce544e8caa48d56d58f056b))
- **composables:** add onResize, useTerminalSize, useTitle, useInterval, useTimeout ([881415f](https://github.com/vue-terminal/vue-termui/commit/881415f370aebf430bb6bd34793e5eaea81078db))
- **composables:** add useFocus and useFocusManager ([6f98c7a](https://github.com/vue-terminal/vue-termui/commit/6f98c7a3df96a221e0a6fd3f1ac197b09712b724))
- dev server with HMR for terminal apps ([6832ffd](https://github.com/vue-terminal/vue-termui/commit/6832ffd4f0a213c04b58544f0349b109145acf37))
- dispose previous dev app on full reload ([823427d](https://github.com/vue-terminal/vue-termui/commit/823427d39a042359719737730049c7bea390da08))
- expose new components ([cd8111b](https://github.com/vue-terminal/vue-termui/commit/cd8111b44e2b412abc0762f7492f844a208b8755))
- focusable ([45e1a74](https://github.com/vue-terminal/vue-termui/commit/45e1a74b0b90b435c6ce2d2cbcd1b7f71da44f40))
- **playground:** focusable sidebar nav + demo pages ([12d0789](https://github.com/vue-terminal/vue-termui/commit/12d078976eb4412233b78a4ff41a4f38c3c26678))
- re-export @opentui/core from vue-termui; playground uses vue-termui only ([1d90b10](https://github.com/vue-terminal/vue-termui/commit/1d90b10bcb7bc78b91ee4e497045bf46d6d31661))
- refactor autofocus ([65c295a](https://github.com/vue-terminal/vue-termui/commit/65c295abda98a7b5183b303bc481b855dfb5437b))
- restore router location across dev full reloads ([f42b233](https://github.com/vue-terminal/vue-termui/commit/f42b2338a25f4405d95337480ad268218406c730))
- scaffold core from template-lib-ts ([16818c2](https://github.com/vue-terminal/vue-termui/commit/16818c2ef53c85bbc2181d4173d04e8daeecd676))
- surface errors in the console overlay instead of crashing ([10c099c](https://github.com/vue-terminal/vue-termui/commit/10c099c028038a9b9c814dfa157b1ebe9d1545f8))
- textarea component ([2b24b80](https://github.com/vue-terminal/vue-termui/commit/2b24b800f91100e091bba44a78558cf4ce225317))
- useCurrentfocusedElement ([7cbf270](https://github.com/vue-terminal/vue-termui/commit/7cbf270abc7401a3e1c0a61b5ebec4b18afab76f))
- Vue custom renderer over OpenTUI (box + text) ([fbadd0c](https://github.com/vue-terminal/vue-termui/commit/fbadd0c2e51d2e961dc0490c02a567d69069b1e3))

### BREAKING CHANGES

- `<Markdown>` now requires a `syntaxStyle` prop. Build one
  with `SyntaxStyle.fromStyles(...)`.
