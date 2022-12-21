import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        component: () => import('@/views/Home/index.vue'),
    },
    {
        path: '/charts',
        component: () => import('@/views/Charts/index.vue'),
    },
    {
        path: '/map',
        component: () => import('@/views/Cesium/index.vue'),
    },
    {
        path: '/threejs',
        component: () => import('@/views/Threejs/index.vue'),
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routes
});

export default router;