<template>
	<div id="CesiumContainer">
		<!-- 地图容器 -->
		<div id="CesiumMap"></div>
		<!-- 指北针 -->
		<!-- <compass :viewer="viewer"></compass> -->
	</div>
</template>

<script setup>
import { initViewer } from '@/utils/cesium/CesiumViewer';
import Compass from './Compass/index.vue';

const viewer = ref(null);

onMounted(() => {
	viewer.value = initViewer('CesiumMap');

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
