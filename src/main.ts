import { createApp } from "vue";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "animate.css/animate.min.css"; //动画库
import App from "./App.vue";
import router from "./router/index.js";
import store from "./store/index.js";

const app = createApp(App);

// axios拦截器配置
// import { get, post } from "./request/index.js";
// app.config.globalProperties.$get = get;
// app.config.globalProperties.$post = post;

// 添加路由守卫
import "./request/permission.js";

// 全局组件及方法挂载
import "virtual:svg-icons-register";
import utils from "./utils/index.js";

app.use(store);
app.use(router);
app.use(ElementPlus);
app.use(utils);

app.mount("#app");