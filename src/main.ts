import { createApp } from 'vue';
import './css/style.css';
import App from './App.vue';
import router from './router/index.js';
import store from './store/index.js';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';

import * as echarts from 'echarts';
window.echarts = echarts; //挂载到window上

const app = createApp(App);
app.use(store);
app.use(router);
app.use(ElementPlus);

app.mount('#app');
