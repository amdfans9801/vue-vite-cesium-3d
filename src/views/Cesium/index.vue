<template>
	<div id="CesiumContainer">
		<!-- 地图容器 -->
		<div id="CesiumMap"></div>
		<!-- 指北针 -->
		<!-- <compass :viewer="viewer"></compass> -->
	</div>
</template>

<script setup>
import { initViewer } from '@/utils/cesium/CesiumViewer.js';
import Compass from './Compass/index.vue';
import { getGisBlue } from '@/utils/cesium/loadProvider.js';

const viewer = ref(null);

onMounted(() => {
	viewer.value = initViewer('CesiumMap');
	let blueblacklayer = getGisBlue();
	let layerobj = viewer.value.imageryLayers.addImageryProvider(blueblacklayer);
    viewer.value.imageryLayers.lowerToBottom(layerobj);
	viewer.value.layers.push(layerobj);
});

defineExpose({
	viewer,
});
</script>

<style scoped>
#CesiumContainer {
	width: 100%;
	height: 100%;
}

#CesiumMap {
	width: 100%;
	height: 100%;
}
</style>
