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
#home {
	position: absolute;
	width: 100%;
	height: 100%;
}
</style>
