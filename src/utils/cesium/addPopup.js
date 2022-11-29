import { Cartesian3, Cartesian2, defined } from "cesium";
/**
 * @Author: dongnan
 * @Description: 雪亮科技(监控弹框)
 * @Date: 2021-08-05 13:46:37
 * @param {*} viewer
 * @param {*} html 弹框内容
 * @param {*} position 弹框坐标
 */
export function addVideoPopup(viewer, option) {
	let htmlOverlay = document.createElement("div");
	htmlOverlay.innerHTML = option.html;
	viewer.cesiumWidget.container.append(htmlOverlay);
	let animateEvent = function (scene, time) {
		let position = Cartesian3.fromDegrees(parseFloat(option.position[0]), parseFloat(option.position[1]));
		let canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position, new Cartesian2());
		if (defined(canvasPosition)) {
			htmlOverlay.style.position = "absolute";
			htmlOverlay.style.top = canvasPosition.y - htmlOverlay.querySelector(".videoBG").clientHeight - 32 + "px";
			htmlOverlay.style.left = canvasPosition.x + 16 + "px";
		}
	};
	viewer.scene.postUpdate.addEventListener(animateEvent);
	htmlOverlay.querySelector(".closeVideoBg").onclick = function () {
		viewer.scene.postUpdate.removeEventListener(animateEvent);
		viewer.cesiumWidget.container.removeChild(htmlOverlay);
		closePlayer();
	};
	return animateEvent;
}
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2022-04-21 16:41:00
 * @param {*} viewer
 * @param {*} eventList
 */
export function removeUserPopup(viewer, eventList) {
	eventList.some((item) => {
		viewer.scene.postUpdate.removeEventListener(item);
	});
	// 清除已显示的弹框
	let popups = viewer.cesiumWidget.container.querySelectorAll(".videoBG");
	for (let pop of popups) {
		viewer.cesiumWidget.container.removeChild(pop.parentElement);
	}
	eventList.splice(0, eventList.length);
}
/**
 * @Author: dongnan
 * @Description: 雪亮科技(监控弹框)
 * @Date: 2021-08-05 13:46:37
 * @param {*} viewer
 * @param {*} html 弹框内容
 * @param {*} position 弹框坐标
 * @param {function} callback 回调
 */
export function addResourcePop(viewer, option) {
	let htmlOverlay = document.createElement("div");
	htmlOverlay.innerHTML = option.html;
	viewer.cesiumWidget.container.append(htmlOverlay);
	let animateEvent = function (scene, time) {
		let position = Cartesian3.fromDegrees(parseFloat(option.position[0]), parseFloat(option.position[1]));
		let canvasPosition = viewer.scene.cartesianToCanvasCoordinates(position, new Cartesian2());
		let container = htmlOverlay.querySelector(".ResourcePop");
		if (defined(canvasPosition)) {
			htmlOverlay.style.position = "absolute";
			htmlOverlay.style.top = canvasPosition.y - container.clientHeight - 42 + "px";
			htmlOverlay.style.left = canvasPosition.x - container.clientWidth / 2 - 4 + "px";
		}
	};
	viewer.scene.postUpdate.addEventListener(animateEvent);
	htmlOverlay.querySelector(".closeResourcePop").onclick = function () {
		viewer.scene.postUpdate.removeEventListener(animateEvent);
		viewer.cesiumWidget.container.removeChild(htmlOverlay);
		closePlayer();
	};
	htmlOverlay.querySelector(".submit").onclick = function () {
		option.callback();
	};
	return animateEvent;
}
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2022-04-21 16:41:00
 * @param {*} viewer
 * @param {*} eventList
 */
export function removeResourcePop(viewer, eventList) {
	eventList.some((item) => {
		viewer.scene.postUpdate.removeEventListener(item);
	});
	// 清除已显示的弹框
	let popups = viewer.cesiumWidget.container.querySelectorAll(".ResourcePop");
	for (let pop of popups) {
		viewer.cesiumWidget.container.removeChild(pop.parentElement);
	}
	eventList.splice(0, eventList.length);
}
