import { createRequire } from 'module';
import { defineConfig, type DefaultTheme } from 'vitepress';

const require = createRequire(import.meta.url);
const pkg = require('vue-gantt-3/vue-gantt-3/package.json');

export const en = defineConfig({
  lang: 'en',
  description: 'A Gantt component for vue3.',

  themeConfig: {
    nav: nav(),

    sidebar: {
      '/guide/': { base: '/guide/', items: sidebarGuide() },
    },

    editLink: {
      pattern: 'https://github.com/xhxhxhxh/vue-gantt-3/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025-present XHXHXHXH'
    }
  }
});

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Guide',
      link: '/guide/getting-start',
      activeMatch: '/guide/'
    },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/xhxhxhxh/vue-gantt-3/blob/main/CHANGELOG.md'
        },
        {
          text: 'Contributing',
          link: 'https://github.com/xhxhxhxh/vue-gantt-3/blob/main/.github/contributing.md'
        }
      ]
    }
  ];
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Introduction',
      collapsed: false,
      items: [
        { text: 'What is VitePress?', link: 'what-is-vitepress' },
        { text: 'Getting Started', link: 'getting-started' },
        { text: 'Routing', link: 'routing' },
        { text: 'Deploy', link: 'deploy' }
      ]
    },
    {
      text: 'Writing',
      collapsed: false,
      items: [
        { text: 'Markdown Extensions', link: 'markdown' },
        { text: 'Asset Handling', link: 'asset-handling' },
        { text: 'Frontmatter', link: 'frontmatter' },
        { text: 'Using Vue in Markdown', link: 'using-vue' },
        { text: 'Internationalization', link: 'i18n' }
      ]
    },
    {
      text: 'Customization',
      collapsed: false,
      items: [
        { text: 'Using a Custom Theme', link: 'custom-theme' },
        {
          text: 'Extending the Default Theme',
          link: 'extending-default-theme'
        },
        { text: 'Build-Time Data Loading', link: 'data-loading' },
        { text: 'SSR Compatibility', link: 'ssr-compat' },
        { text: 'Connecting to a CMS', link: 'cms' }
      ]
    }
  ];
}
