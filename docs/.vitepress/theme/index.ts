// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './custom.scss';
import Vue3Gantt from 'vue-gantt-3';
import GanttPreview from 'vue-gantt-3-play/App.vue';
import { globals } from '../vitepress';
import type { Component } from 'vue';

const modules = import.meta.glob('../../examples/*.vue', { eager: true });

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    app.component('Vue3Gantt', Vue3Gantt);
    app.component('GanttPreview', GanttPreview);

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
} satisfies Theme;

