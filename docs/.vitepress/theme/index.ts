// https://vitepress.dev/guide/custom-theme
import { h } from 'vue';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import './custom.scss';
import Vue3Gantt from 'vue-gantt-3';
import GanttPreview from 'vue-gantt-3-play/App.vue';

export default {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
    });
  },
  enhanceApp({ app, router, siteData }) {
    // router.onBeforeRouteChange = (to) => {
    //   console.log('to', to);
    //   if (to === '/') {
    //     router.go('/en'); // redirect to /en
    //     return false;
    //   } else {
    //     return true;
    //   }

    // };

    app.component('Vue3Gantt', Vue3Gantt);
    app.component('GanttPreview', GanttPreview);
  }
} satisfies Theme;
