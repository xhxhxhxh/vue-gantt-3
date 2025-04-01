import { createRequire } from 'module';
import { defineConfig, type DefaultTheme } from 'vitepress';

const require = createRequire(import.meta.url);
const pkg = require('vue-gantt-3/vue-gantt-3/package.json');

export const zh = defineConfig({
  lang: 'zh',
  description: '一个基于vue3的甘特图组件',

  themeConfig: {
    nav: nav(),

    sidebar: {
      '/zh/guide/': { base: '/zh/guide/', items: sidebarGuide() },
    },

    editLink: {
      pattern: 'https://github.com/xhxhxhxh/vue-gantt-3/edit/main/docs/:path',
      text: '在GitHub上编辑此页面'
    },

    footer: {
      message: '基于 MIT 许可发布',
      copyright: '版权所有 © 2025-目前 XHXHXHXH'
    }
  }
});

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '指南',
      link: '/zh/guide/introduction',
      activeMatch: '/zh/guide/'
    },
    {
      text: pkg.version,
      items: [
        {
          text: '更新日志',
          link: 'https://github.com/xhxhxhxh/vue-gantt-3/blob/main/CHANGELOG.md'
        },
        {
          text: '参与贡献',
          link: 'https://github.com/xhxhxhxh/vue-gantt-3/blob/main/.github/contributing.md'
        }
      ]
    }
  ];
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: '介绍',
      link: 'introduction'
    },
    {
      text: '安装',
      link: 'installation',
    },
    {
      text: '用法',
      link: 'usage',
    },
    {
      text: 'API',
      link: 'api',
    }
  ];
}
