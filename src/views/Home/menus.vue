<template>
    <div id="menus">
        <div id="goto_cesium" @click="goto_cesium()"></div>
        <div id="goto_threejs" @click="goto_threejs()"></div>
        <div id="goto_echarts" @click="goto_echarts()"></div>
    </div>
</template>

<script setup>
import router from 'src/router';


router.push({ path: '/map' });
</script>

<style scoped>
@import url('./css/menustyle.css');
</style>