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
      link: 'introduction'
    },
    {
      text: 'Getting Started',
      link: 'getting-started',
    },
    {
      text: 'Usage',
      link: 'usage',
    },
    {
      text: 'API',
      link: 'api',
    }
  ];
}
