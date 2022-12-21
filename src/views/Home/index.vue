<template>
	<div id="home">
		<!-- 地图容器 -->
		<menus></menus>
		<Map ref="mapContainer" v-show="isShowMap"></Map>
	</div>
</template>

<script setup>
import Map from '../Cesium/index.vue';
import menus from './menus.vue';

const isShowMap = ref(false);
</script>

<style scoped>
@import url('./css/homestyle.css');
</style>
