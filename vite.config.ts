import Vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite-plus'
import pkg from './package.json' with { type: 'json' }

const banner = `
/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${new Date().getFullYear()} Eduardo San Martin Morote
 * @license MIT
 */
`.trim()

export default defineConfig({
  pack: {
    banner,
    sourcemap: true,
    format: ['esm'],
    deps: {
      onlyBundle: [],
      neverBundle: ['vue'],
      // tsdown <0.23 compatibility: resolve external dependency subpaths.
      // Remove to preserve subpath imports as written (the new default).
      // https://tsdown.dev/options/dependencies#deps-resolvedepsubpath
      resolveDepSubpath: true,
    },
    target: 'esnext',
    tsconfig: 'tsconfig.build.json',
    dts: {
      enabled: true,
      // NOTE: if you cannot use isolatedDeclarations, this makes writing types
      // bit harder but makes the generation way faster. Disable if you can't
      // explicitely type all exported values.
      // See https://github.com/microsoft/TypeScript/issues/58944#issuecomment-4213203205
      generator: 'oxc',
    },
    // sets package.json "exports" field to the generated files
    exports: true,
    clean: true,
    entry: ['src/index.ts', 'src/vite.ts'],
    globalName: 'VueTermui',
  },
  test: {
    // Vitest v4 compatibility: preserve mock call history.
    // Remove after tests no longer rely on calls from setup or earlier tests.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
    clearMocks: false,
    // Vitest v4 compatibility: keep separate Vite servers for inline projects.
    // Remove when plugins and config hooks can run once for shared projects.
    // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
    // https://vitest.dev/guide/migration/#inline-projects-share-the-vite-server-by-default
    sharedViteServer: false,
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcovonly', 'html'],
      include: ['src', 'packages/three/src'],
      exclude: ['**/src/index.ts', '**/*.test-d.ts', '**/__tests__/**'],
    },

    projects: [
      {
        // Vitest v4 compatibility: keep this inline project independent of the root config.
        // Remove to inherit root options, including plugins and setup files.
        // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
        // https://vitest.dev/guide/migration/#inline-projects-inherit-the-root-config-by-default
        extends: false,
        plugins: [Vue()],
        test: {
          // Vitest v4 compatibility: preserve mock call history.
          // Remove after tests no longer rely on calls from setup or earlier tests.
          // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
          // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
          clearMocks: false,
          name: 'core',
          include: ['src/**/*.{test,spec}.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
          },
        },
      },
      {
        // Vitest v4 compatibility: keep this inline project independent of the root config.
        // Remove to inherit root options, including plugins and setup files.
        // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
        // https://vitest.dev/guide/migration/#inline-projects-inherit-the-root-config-by-default
        extends: false,
        test: {
          // Vitest v4 compatibility: preserve mock call history.
          // Remove after tests no longer rely on calls from setup or earlier tests.
          // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
          // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
          clearMocks: false,
          name: 'three',
          include: ['packages/three/src/**/*.{test,spec}.ts'],
          environment: 'node',
          typecheck: {
            enabled: true,
          },
        },
      },
      {
        // Vitest v4 compatibility: keep this inline project independent of the root config.
        // Remove to inherit root options, including plugins and setup files.
        // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
        // https://vitest.dev/guide/migration/#inline-projects-inherit-the-root-config-by-default
        extends: false,
        plugins: [Vue()],
        test: {
          // Vitest v4 compatibility: preserve mock call history.
          // Remove after tests no longer rely on calls from setup or earlier tests.
          // https://viteplus.dev/guide/vitest-v5#remove-unneeded-compatibility-settings
          // https://vitest.dev/guide/migration/#clearmocks-is-enabled-by-default
          clearMocks: false,
          name: 'session-player',
          include: ['session-player/src/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
    ],
  },
  staged: {
    '*': [
      'vp fmt --no-error-on-unmatched-pattern',
      'vp lint --no-error-on-unmatched-pattern --fix',
    ],
  },
  fmt: {
    semi: false,
    printWidth: 100,
    trailingComma: 'all',
    experimentalSortPackageJson: false,
    singleQuote: true,
    ignorePatterns: ['pnpm-lock.yaml', 'old/'],
  },
  lint: {
    plugins: ['unicorn', 'typescript', 'oxc'],
    jsPlugins: [
      'oxlint-plugin-posva',
      {
        name: 'vite-plus',
        specifier: 'vite-plus/oxlint-plugin',
      },
    ],
    categories: {
      correctness: 'error',
      suspicious: 'off',
      nursery: 'off',
      pedantic: 'off',
      perf: 'warn',
      style: 'off',
    },
    rules: {
      'no-debugger': 'off',
      'no-control-regex': 'off',
      'no-dupe-class-members': 'error',
      'no-unused-vars': 'off',
      'unicorn/no-useless-spread': 'off',
      'no-console': [
        'error',
        {
          allow: ['warn', 'error'],
        },
      ],
      'numeric-separators-style': 'warn',
      curly: ['error', 'multi-line'],
      'require-post-message-target-origin': 'off',
      'posva/vitest-prefer-to-have-been-called-times': 'error',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    settings: {
      'jsx-a11y': {
        components: {},
        attributes: {},
      },
      next: {
        rootDir: [],
      },
      react: {
        formComponents: [],
        linkComponents: [],
      },
      jsdoc: {
        ignorePrivate: false,
        ignoreInternal: false,
        ignoreReplacesDocs: true,
        overrideReplacesDocs: true,
        augmentsExtendsReplacesDocs: false,
        implementsReplacesDocs: false,
        exemptDestructuredRootsFromChecks: false,
        tagNamePreference: {},
      },
    },
    env: {
      builtin: true,
    },
    globals: {},
    ignorePatterns: [
      '**/*.ts.timestamp*',
      'dist',
      'scripts',
      '**/CLAUDE.md',
      'old',
      'packages/create-vue-termui/template',
    ],
    overrides: [
      {
        files: ['playground/**', 'packages/create-vue-termui/**'],
        rules: {
          'no-console': 'off',
        },
      },
    ],
  },
})
