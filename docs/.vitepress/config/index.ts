import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import { en } from './en';
import { zh } from './zh';
import { mdPlugin } from './plugins';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "vue-gantt-3-docs",
  cleanUrls: true,
  themeConfig: {
    logo: { src: '/logo.svg', width: 24, height: 24 },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/xhxhxhxh/vue-gantt-3' }
    ],
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
  ],
  locales: {
    'root': {
      label: 'English',
      ...en
    },
    'zh': {
      label: '简体中文',
      ...zh
    }
  },
  rewrites: {
    'en/:rest*': ':rest*'
  },
  markdown: {
    config: (md) => mdPlugin(md),
  },
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../../src', import.meta.url)),
      }
    }
  }
});
