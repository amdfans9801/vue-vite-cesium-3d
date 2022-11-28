import { createRouter, createWebHashHistory } from "vue-router";

const routers = [
    {
        path: '/',
        redirect: '/home',
    },
    {
        path: '/home',
        component: () => import('@/views/Home/index.vue'),
    }
];

const router = createRouter({
    history: createWebHashHistory(),
    routers
});

export default router;