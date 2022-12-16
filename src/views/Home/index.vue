<template>
	<div id="home">
		<!-- 地图容器 -->
		<Map ref="mapContainer" v-show="isShowMap"></Map>
	</div>
</template>

<script setup>
import Map from '../Cesium/index.vue';

const isShowMap = ref(true);
</script>

<style scoped>
@import url('./css/homestyle.css');
</style>
