# Contributing

Contributions are welcome and will be fully credited!

We accept contributions via Pull Requests on [Github](https://github.com/vue-terminal/vue-termui).

## Pull Requests

Here are some guidelines to make the process smoother:

- **Add a test** - New features and bugfixes need tests. If you find it difficult to test, please tell us in the pull request and we will try to help you!
- **Document any change in behaviour** - Make sure the `README.md` and any other relevant documentation are kept up-to-date.
- **Run `pnpm run test` locally** - This will allow you to go faster
- **One pull request per feature** - If you want to do more than one thing, send multiple pull requests.
- **Set a coherent title** - Make sure your commit(s) message means something. Note commits will be squashed.
- **Consider our release cycle** - We try to follow [SemVer v2.0.0](http://semver.org/). Randomly breaking public APIs is not an option.

Check the [project guidelines](#project-guidelines) to find help moving around the codebase.

## Creating issues

### Bug reports

When creating an issue, try to provide a minimal reproduction or a failing test case within the repository.

### Feature requests

Lay out the reasoning behind it and propose an API for it. Ideally, you should have a practical example to prove the utility of the feature you're requesting.

## Project Guidelines

After pulling the project code and installing deps with `pnpm i`. run `pnpm run stub` at the root of the project. You can `cd packages/playground` and run `pnpm run dev` to test the playground.

This project uses pnpm workspaces and contains different packages:

### packages/core

This folder contains the `vue-termui` package. It's contains the Vue Custom Renderer, all the logic to handle terminal escape codes and input, and client HMR code.

### packages/vite-plugin-vue-termui

This folder contains the `vite-plugin-vue-termui` package. It's contains the Vite plugin that is required to build a Vue TermUI project and includes other Vite plugins like the Vue one and automatic imports.

### packages/create-vue-termui

This folder contains the `create-vue-termui` package. It's the scaffolding tool to create a Vue TermUI project.

### packages/cli

This folder contains the `@vue-termui/cli` package. It's the CLI used to develop and bundle Vue TermUI applications. It contains the HMR logic used on the server.

Note: **Any other folder is probably a test and might be outdated.**
