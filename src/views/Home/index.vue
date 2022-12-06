<template>
	<div id="home">
		<!-- 地图容器 -->
		<Map ref="mapContainer" v-show="mapLoadParams.showMap"></Map>
	</div>
</template>

<script setup>
import Map from '../Cesium/index.vue';
</script>

<style scoped>
#home {
	width: 100%;
	height: 100%;
}
</style>
