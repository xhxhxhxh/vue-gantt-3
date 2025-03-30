import { defineConfig } from 'vitepress';
import { fileURLToPath, URL } from 'node:url';
import { en } from './en';
import { zh } from './zh';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "vue-gantt-3-docs",
  cleanUrls: true,
  themeConfig: {
    logo: { src: '/logo.svg', width: 24, height: 24 },
  },
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
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('../../../src', import.meta.url)),
      }
    }
  }
});
