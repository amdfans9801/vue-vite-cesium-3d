<template>
	<div id="CesiumContainer">
		<!-- 地图容器 -->
		<div id="CesiumMap"></div>
		<!-- 指北针 -->
		<compass></compass>
		<uploadfile></uploadfile>
	</div>
</template>

<script setup>
import { initViewer } from '@/utils/cesium/CesiumViewer.js';
import compass from './Compass/index.vue';
import { getGisBlue } from '@/utils/cesium/loadProvider.js';
import { Cartesian3 } from 'cesium';
import uploadfile from '../Upload/index.vue';

const viewer = ref(null);

onMounted(() => {
	viewer.value = initViewer('CesiumMap');
	// 加载蓝黑底图
	window.viewer = viewer.value;
	addBlueBlackLayer();
	// window.viewer.camera.flyTo({
	// 	destination: new Cartesian3.fromDegrees(118.7286257924172, 31.864404015122627, 5000),
	// });
});

function addBlueBlackLayer() {
	viewer.value.layers = [];
	let blueblacklayer = [getGisBlue()];
	if (Array.isArray(blueblacklayer) && blueblacklayer.length > 0) {
		viewer.value.imageryLayers.removeAll();
		blueblacklayer.some((item) => {
			let layer = viewer.value.imageryLayers.addImageryProvider(item);
			viewer.value.imageryLayers.lowerToBottom(layer);
			viewer.value.layers.push(layer);
		});
	}
}

defineExpose({
	viewer,
});
</script>

<style scoped>
#CesiumContainer {
	position: absolute;
	width: 100%;
	height: 100%;
}

#CesiumMap {
	width: 100%;
	height: 100%;
}
</style>
