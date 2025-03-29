import { createApp } from 'vue';
import App from './App.vue';
import Vue3Gantt from 'vue-gantt-3';

const app = createApp(App);
app.use(Vue3Gantt);
app.mount('#app');
