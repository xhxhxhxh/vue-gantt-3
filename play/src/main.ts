import { createApp } from 'vue';
import App from './App.vue';
import VueGantt3 from 'vue-gantt-3';

const app = createApp(App);
app.use(VueGantt3);
app.mount('#app');
