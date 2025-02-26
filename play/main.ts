import { createApp } from 'vue';
import App from './App.vue';
import vue3GanttChart from 'vue3-gantt-chart';

const app = createApp(App);
app.use(vue3GanttChart);
app.mount('#app');
