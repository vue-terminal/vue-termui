import { defineConfigWithTheme } from 'vitepress'
import type { Config as ThemeConfig } from '@posva/vue-theme'
import baseConfig from '@posva/vue-theme/config'

const nav = [
  {
    text: 'Docs',
    activeMatch: `^/(guide|examples)/`,
    items: [
      { text: 'Quick Start', link: '/guide/quick-start' },
      { text: 'Guide', link: '/guide/introduction' },
      // { text: 'Examples', link: '/examples/' },
    ],
  },
  {
    text: 'API',
    activeMatch: `^/api/`,
    link: '/api/',
  },
  {
    text: 'Sponsor',
    link: 'https://esm.dev/sponsor',
  },
]

export const sidebar = {
  '/guide/': [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/introduction' },
        {
          text: 'Quick Start',
          link: '/guide/quick-start',
        },
      ],
    },
    {
      text: 'Essentials',
      items: [
        {
          text: 'Creating an Application',
          link: '/guide/essentials/todo',
        },
        {
          text: 'Handling Input',
          link: '/guide/essentials/todo',
        },
      ],
    },
    {
      text: 'Built-in Components',
      items: [
        // {
        //   text: 'TuiBox',
        //   link: '/guide/components/tui:box',
        // },
        { text: 'TuiText', link: '/guide/components/tui-text' },
      ],
    },
    // {
    //   text: 'Advanced',
    //   items: [
    //     {
    //       text: 'Handling Focus',
    //       link: '/guide/advanced/handling-focus',
    //     },
    //   ],
    // },
  ],
  // '/api/': TODO:
  // '/examples/': [
  //   {
  //     text: 'Basic',
  //     items: [
  //       {
  //         text: 'Hello World',
  //         link: '/examples/#hello-world',
  //       },
  //     ],
  //   },
  // ],
}

export default defineConfigWithTheme<ThemeConfig>({
  extends: baseConfig,
  lang: 'en-US',
  title: 'Vue TermUI',
  description: 'Vue TermUI - The Modern Terminal UI Framework',
  srcDir: 'src',
  scrollOffset: 'header',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
    ['meta', { name: 'twitter:site', content: '@posva' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://vue-termui.esm/logo.png',
      },
    ],
    // TODO: analytics in prod only
  ],

  themeConfig: {
    nav,
    // TODO: add this
    // docsDir: 'packages/docs',
    sidebar,
    logo: '/logo.svg',

    // TODO: add
    // algolia: {
    //   indexName: 'vuejs',
    //   appId: 'ML0LEBN7FQ',
    //   apiKey: 'f49cbd92a74532cc55cfbffa5e5a7d01',
    //   searchParameters: {
    //     facetFilters: ['version:v3'],
    //   },
    // },

    // carbonAds: {
    //   code: 'CEBDT27Y',
    //   placement: 'vuejsorg',
    // },

    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/vue-terminal/vue-termui',
      },
      { icon: 'twitter', link: 'https://twitter.com/posva' },
      { icon: 'discord', link: 'https://discord.gg/HPVS2AbgXP' },
    ],

    editLink: {
      repo: 'vue-terminal/vue-termui',
      folder: 'packages/docs/src',
      text: 'Edit this page on GitHub',
    },

    footer: {
      license: {
        text: 'MIT License',
        link: 'https://opensource.org/licenses/MIT',
      },
      copyright: `Copyright © 2022-${new Date().getFullYear()} Eduardo San Martin Morote`,
    },
  },

  vite: {
    optimizeDeps: {
      include: [],
      exclude: ['@vue/repl', '@posva/vue-theme'],
    },
    // @ts-ignore
    ssr: {
      external: ['@vue/repl'],
    },
    server: {
      host: true,
      fs: {
        // for when developing with locally linked theme
        allow: ['../../../node_modules'],
      },
    },
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: Infinity,
    },
    json: {
      stringify: true,
    },
  },

  vue: {
    reactivityTransform: true,
  },
})
