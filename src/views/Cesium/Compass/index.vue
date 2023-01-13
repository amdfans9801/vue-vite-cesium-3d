<script setup name="地图罗盘">
import commonfuncs from './libs/commonfuncs.js';
import coordinates from './libs/Coordinates.js';
import { Math as CesiumMath } from 'cesium';

const northtin = ref(null);

onMounted(() => {
	nextTick(() => {
		viewer.scene.postRender.addEventListener(function () {
			let scenemode = viewer.scene.mode;
			if (scenemode == 3 || scenemode == 1) {
				let headingdeg = CesiumMath.toDegrees(viewer.camera.heading);
				northtin.value.style.transform = 'rotate(' + headingdeg + 'deg)';
			}
		});
	});
});

//指北
function northClick() {
	let camera = commonfuncs.GetCamera(viewer);
	let wgs84poi = new coordinates.CoordinateWGS84(camera.longitude, camera.latitude, camera.height);
	let wgs84poinew = commonfuncs.GetPointOnSameCircle(wgs84poi, camera.heading, 0, camera.pitch);

	commonfuncs.FlyToWithDuration(wgs84poinew.latitude, wgs84poinew.longitude, camera.height, 0, camera.pitch, camera.roll, -1, viewer);
}

//放大
function zoomIn() {
	let Camera = commonfuncs.GetCamera(viewer);
	// if (Camera.height < 100) {
	// 	return;
	// } else if (Camera.height < 12000) {
	// 	viewer.camera.zoomIn(Camera.height * 0.6);
	// } else {
	// 	viewer.camera.zoomIn(12000);
	// }
	viewer.camera.zoomIn(Camera.height * 0.6);
}

//缩小
function zoomOut() {
	let Camera = commonfuncs.GetCamera(viewer);
	// if (Camera.height > 12000) {
	// 	return;
	// } else {
	// 	viewer.camera.zoomOut(Camera.height / 0.6);
	// }
	viewer.camera.zoomOut(Camera.height / 0.6);
}

//全屏
function fullscreenClick() {
	if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.msRequestFullscreen) {
			document.documentElement.msRequestFullscreen();
		} else if (document.documentElement.mozRequestFullScreen) {
			document.documentElement.mozRequestFullScreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	}
}
</script>
<template>
	<div class="CesiumTool">
		<div class="northinButton">
			<img src="./assets/compass.svg" style="position: absolute; :0px " />
			<img src="./assets/northin.svg" ref="northtin" class="northArrow" @click="northClick" />
		</div>

		<div class="zoomInButton">
			<img src="./assets/zoomIn.svg" @click="zoomIn" />
		</div>

		<div class="zoomOutButton">
			<img src="./assets/zoomOut.svg" @click="zoomOut" />
		</div>

		<div class="fullscreenButton">
			<img src="./assets/fullscreen.svg" @click="fullscreenClick" />
		</div>
	</div>
</template>
<style lang="less" scoped>
.CesiumTool {
	position: absolute;
	bottom: 30px;
	right: 20px;
	.northinButton {
		width: 34px;
		height: 34px;
		cursor: pointer;
		img,
		.northArrow {
			position: absolute;
			width: 34px;
			height: 34px;
			right: 0;
		}
	}

	.zoomInButton {
		width: 34px;
		height: 34px;
		cursor: pointer;
	}

	.zoomOutButton {
		width: 34px;
		height: 34px;
		cursor: pointer;
	}

	.fullscreenButton {
		width: 34px;
		height: 34px;
		cursor: pointer;
	}
}
</style>
