// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './custom.scss';
import type { Component } from 'vue';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  async enhanceApp({ app, router, siteData }) {
    if (!import.meta.env.SSR) {
      const VueGantt3 = await import('vue-gantt-3');
      const GanttPreview = await import('vue-gantt-3-play/App.vue');
      const { globals } = await import('../vitepress');
      const modules = import.meta.glob('../../examples/*.vue', { eager: true });

      app.component('VueGantt3', VueGantt3.default);
      app.component('GanttPreview', GanttPreview.default);

      globals.forEach(([name, Comp]) => {
        app.component(name, Comp);
      });

      for (const path in modules) {
        const mod = modules[path] as any;
        const fileName = path.split('/').pop() || '';
        const fileBaseName = fileName.split('.')[0];
        const compName = 'vgDoc' + fileBaseName.charAt(0).toUpperCase() + fileBaseName.slice(1);
        app.component(compName, mod.default as Component);
      }
    }

  }
} satisfies Theme;

