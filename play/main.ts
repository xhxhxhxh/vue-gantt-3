import { createApp } from 'vue';
import App from './App.vue';
import Vue3GanttChart from 'vue3-gantt-chart';

const app = createApp(App);
app.use(Vue3GanttChart);
app.mount('#app');
