import { defineConfig } from 'vitepress'

export const META_URL = 'https://vue-termui.esm.dev'
export const META_TITLE = 'Vue TermUI'
export const META_DESCRIPTION = 'Build modern Terminal User Interfaces with Vue.js'

export default defineConfig({
  title: META_TITLE,
  description: META_DESCRIPTION,
  lang: 'en-US',
  appearance: 'dark',
  scrollOffset: 'header',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],

    ['meta', { name: 'theme-color', content: '#de41e0' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:title', content: META_TITLE }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'og:image', content: `${META_URL}/social.png` }],

    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:site', content: '@posva' }],
    ['meta', { name: 'twitter:title', content: META_TITLE }],
    ['meta', { name: 'twitter:description', content: META_DESCRIPTION }],
    ['meta', { name: 'twitter:image', content: `${META_URL}/social.png` }],
  ],

  markdown: {
    theme: {
      dark: 'laserwave',
      light: 'catppuccin-latte',
    },
  },

  themeConfig: {
    logo: '/logo.svg',
    outline: [2, 3],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vue-terminal/vue-termui' },
      { icon: 'x', link: 'https://twitter.com/posva' },
      { icon: 'discord', link: 'https://discord.gg/HPVS2AbgXP' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Eduardo San Martin Morote',
    },

    editLink: {
      pattern: 'https://github.com/vue-terminal/vue-termui/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    search: {
      provider: 'local',
      options: {
        detailedView: true,
        miniSearch: {
          searchOptions: {
            boostDocument(docId: string) {
              if (docId.startsWith('/components/')) return 1.3
              if (docId.startsWith('/guide/')) return 1.5
              return 1
            },
          },
        },
      },
    },

    nav: [
      {
        text: 'Guide',
        link: '/guide/introduction',
        activeMatch: '^/(guide|essentials)/',
      },
      {
        text: 'Components',
        link: '/components/',
        activeMatch: '^/components/',
      },
      { text: 'Cookbook', link: '/cookbook/', activeMatch: '^/cookbook/' },
      {
        text: 'Links',
        items: [
          {
            text: 'Discord',
            link: 'https://discord.gg/HPVS2AbgXP',
          },
          {
            text: 'Discussions',
            link: 'https://github.com/vue-terminal/vue-termui/discussions',
          },
          {
            text: 'Changelog',
            link: 'https://github.com/vue-terminal/vue-termui/blob/main/packages/core/CHANGELOG.md',
          },
        ],
      },
    ],

    sidebar: {
      '/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Vue TermUI?', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Essentials',
          items: [
            { text: 'Creating an Application', link: '/essentials/application' },
            { text: 'Layout & Boxes', link: '/essentials/layout' },
            { text: 'Styling Text', link: '/essentials/text' },
            { text: 'Handling Input', link: '/essentials/input' },
            {
              text: 'Keybinding Best Practices',
              link: '/essentials/keybindings',
            },
            { text: 'Focus Management', link: '/essentials/focus' },
            { text: 'Composables & Reactivity', link: '/essentials/composables' },
            { text: 'Routing', link: '/essentials/routing' },
          ],
        },
        {
          text: 'Built-in Components',
          link: '/components/',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: '&lt;Box&gt;', link: '/components/box' },
            { text: '&lt;Text&gt;', link: '/components/text' },
            { text: '&lt;Newline&gt;', link: '/components/newline' },
            { text: '&lt;Input&gt;', link: '/components/input' },
            { text: '&lt;Select&gt;', link: '/components/select' },
            { text: '&lt;ProgressBar&gt;', link: '/components/progress-bar' },
          ],
        },
        {
          text: 'Cookbook',
          link: '/cookbook/',
          items: [
            { text: 'Overview', link: '/cookbook/' },
            { text: 'Building a Counter', link: '/cookbook/counter' },
            { text: 'A Bouncing Box', link: '/cookbook/bouncing-box' },
            { text: 'Forms & Inputs', link: '/cookbook/forms' },
          ],
        },
      ],
    },
  },
})
