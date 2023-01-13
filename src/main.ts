// polyfills
if (typeof (window as any).global === 'undefined') {
	(window as any).global = window;
}

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

let retrunback = document.createElement('div');
document.getElementById('app')?.appendChild(retrunback);
retrunback.id = 'gobackhome';
retrunback.onclick = () => {
	router.push('/');
};
