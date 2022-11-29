import {
	Math as CesiumMath,
	defined,
	defaultValue,
	BoundingSphere,
	Cartesian3,
	HeadingPitchRange,
	Rectangle,
	Cartesian2,
	EllipsoidGeodesic,
} from "cesium";
/**
 * @Author: dongnan
 * @Description: 定位
 * @Date: 2021-05-04 19:25:35
 * @param {Viewer} viewer
 * @param {Object} options 选项
 * @param {Array} center [x,y]
 * @param {Float} heading 默认 0
 * @param {Float} pitch 默认 -45
 * @param {Float} range 默认 1000
 * @param {Array} padding 偏移范围 [上,右,下,左] 实际偏移距离米
 * @param {Float} duration 运动时间
 * @param {Function} callback 视角切换完的回调
 */
export function zoomTo(viewer, options) {
	if (!defined(options.center)) return;
	let center = options.center;
	let duration = defaultValue(options.duration, 0);
	let heading = defaultValue(options.heading, 0);
	let pitch = defaultValue(options.pitch, -45);
	let range = defaultValue(options.range, 1000);
	if (defined(options.padding)) {
		let topOffset = defaultValue(meterToDegree(options.padding[0]), 0);
		let rightOffset = defaultValue(meterToDegree(options.padding[1]), 0);
		let bottomOffset = defaultValue(meterToDegree(options.padding[2]), 0);
		let leftOffset = defaultValue(meterToDegree(options.padding[3]), 0);
		center[0] = center[0] + rightOffset;
		center[0] = center[0] - leftOffset;
		center[1] = center[1] + topOffset;
		center[1] = center[1] - bottomOffset;
	}
	viewer.camera.flyToBoundingSphere(new BoundingSphere(Cartesian3.fromDegrees(parseFloat(center[0]), parseFloat(center[1])), 0), {
		duration: duration,
		offset: new HeadingPitchRange(CesiumMath.toRadians(heading), CesiumMath.toRadians(pitch), range),
		complete: options.callback,
	});
}
/**
 * @Author: dongnan
 * @Description: 缩放至范围(视角调整)
 * @Date: 2021-09-12 13:20:30
 * @param {Viewer} viewer
 * @param {*} options 选项
 * @param {Array} extent 边界范围
 * @param {Float} heading 默认 0
 * @param {Float} pitch 默认 -45
 * @param {Float} radius 默认 3 球半径
 * @param {Array} padding 偏移范围 [上,右,下,左] 实际偏移距离米
 * @param {Float} duration 运动时间
 * @param {Function} callback 视角切换完的回调
 */
export function zoomToExtent(viewer, options) {
	if (!defined(options.extent)) return;
	let extent = options.extent;
	let duration = defaultValue(options.duration, 0.5);
	let heading = defaultValue(options.heading, 0);
	let pitch = defaultValue(options.pitch, -45);
	let radius = defaultValue(options.radius, 3);
	let boundingSphere = BoundingSphere.fromRectangle3D(
		Rectangle.fromDegrees(parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])),
	);
	if (defined(options.padding)) {
		let currentExtent = extent;
		let topOffset = defaultValue(meterToDegree(options.padding[0]), 0);
		let rightOffset = defaultValue(meterToDegree(options.padding[1]), 0);
		let bottomOffset = defaultValue(meterToDegree(options.padding[2]), 0);
		let leftOffset = defaultValue(meterToDegree(options.padding[3]), 0);
		let bound = [
			currentExtent[0] - leftOffset,
			currentExtent[1] - bottomOffset,
			currentExtent[2] + rightOffset,
			currentExtent[3] + topOffset,
		];
		let newSphere = BoundingSphere.fromRectangle3D(
			Rectangle.fromDegrees(parseFloat(bound[0]), parseFloat(bound[1]), parseFloat(bound[2]), parseFloat(bound[3])),
		);
		viewer.camera.flyToBoundingSphere(newSphere, {
			duration: duration,
			offset: new HeadingPitchRange(CesiumMath.toRadians(heading), CesiumMath.toRadians(pitch), (boundingSphere.radius * radius) / 2),
			complete: options.callback,
		});
	} else {
		viewer.camera.flyToBoundingSphere(boundingSphere, {
			duration: duration,
			offset: new HeadingPitchRange(CesiumMath.toRadians(heading), CesiumMath.toRadians(pitch), boundingSphere.radius * radius),
			complete: options.callback,
		});
	}
}
/**
 * @Author: dongnan
 * @Description: 缩放至范围(视角调整)
 * @Date: 2021-09-12 13:20:30
 * @param {Viewer} viewer
 * @param {Object} options {targetExtent:目标边界(必填),parentExtent:上级边界(必填),heading:0,pitch:-30,radius:3,(球半径),callback:视角切换完成时回调}
 */
export function animateZoom(viewer, options) {
	if (!defined(options.parentExtent) && !defined(options.targetExtent)) {
		return;
	}
	let parentExtent = options.parentExtent;
	let targetExtent = options.targetExtent;
	let duration = defaultValue(options.duration, 0.5);
	let heading = defaultValue(options.heading, 0);
	let pitch = defaultValue(options.pitch, -30);
	let radius = defaultValue(options.radius, 3);
	let parentSphere = BoundingSphere.fromRectangle3D(
		Rectangle.fromDegrees(
			parseFloat(parentExtent[0]),
			parseFloat(parentExtent[1]),
			parseFloat(parentExtent[2]),
			parseFloat(parentExtent[3]),
		),
	);
	let targetSphere = BoundingSphere.fromRectangle3D(
		Rectangle.fromDegrees(
			parseFloat(targetExtent[0]),
			parseFloat(targetExtent[1]),
			parseFloat(targetExtent[2]),
			parseFloat(targetExtent[3]),
		),
	);
	viewer.camera.flyToBoundingSphere(parentSphere, {
		duration: duration / 2,
		offset: new HeadingPitchRange(CesiumMath.toRadians(heading - 60), CesiumMath.toRadians(-60), parentSphere.radius * radius),
		complete: () => {
			viewer.camera.flyToBoundingSphere(targetSphere, {
				duration: duration / 2,
				offset: new HeadingPitchRange(CesiumMath.toRadians(heading), CesiumMath.toRadians(pitch), targetSphere.radius * radius),
				complete: options.callback,
			});
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 缩放至范围(垂直视角)
 * @Date: 2021-07-31 10:34:31
 * @param {Viewer} viewer
 * @param {Array} extent 视角范围(必填)
 * @param {Array} padding [上,右,下,左] 距离米
 */
export function fitBounds(viewer, extent, padding) {
	if (!defined(extent)) {
		return;
	}
	padding = defaultValue(padding, [0, 0, 0, 0]);
	let rectangle = Rectangle.fromDegrees(extent[0], extent[1], extent[2], extent[3]);
	viewer.camera.flyTo({
		destination: rectangle,
		duration: 0.5,
		complete: function () {
			let resolution = getResolution(viewer);
			let topOffset = defaultValue(meterToDegree(padding[0] * resolution), 0);
			let rightOffset = defaultValue(meterToDegree(padding[1] * resolution), 0);
			let bottomOffset = defaultValue(meterToDegree(padding[2] * resolution), 0);
			let leftOffset = defaultValue(meterToDegree(padding[3] * resolution), 0);
			let bound = [extent[0] - 2 * leftOffset, extent[1] - 2 * bottomOffset, extent[2] + 2 * rightOffset, extent[3] + 2 * topOffset];
			let rectangle2 = Rectangle.fromDegrees(bound[0], bound[1], bound[2], bound[3]);
			viewer.camera.flyTo({
				destination: rectangle2,
				duration: 1,
			});
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 计算画布中心距离为1px的两点的实际距离 单位米
 * @Date: 2021-07-31 17:45:25
 * @param {*} viewer
 */
function getResolution(viewer) {
	let scene = viewer.scene;
	// 获取画布的大小
	let width = scene.canvas.clientWidth;
	let height = scene.canvas.clientHeight;
	//获取画布中心两个像素的坐标（默认地图渲染在画布中心位置）
	let left = scene.camera.getPickRay(new Cartesian2((width / 2) | 0, (height - 1) / 2));
	let right = scene.camera.getPickRay(new Cartesian2((1 + width / 2) | 0, (height - 1) / 2));
	let globe = scene.globe;
	let leftPosition = globe.pick(left, scene);
	let rightPosition = globe.pick(right, scene);
	if (!defined(leftPosition) || !defined(rightPosition)) {
		return;
	}
	let leftCartographic = globe.ellipsoid.cartesianToCartographic(leftPosition);
	let rightCartographic = globe.ellipsoid.cartesianToCartographic(rightPosition);
	let geodesic = new EllipsoidGeodesic();
	geodesic.setEndPoints(leftCartographic, rightCartographic);
	let distance = geodesic.surfaceDistance / 1000; //分辨率
	return distance;
}
/**
 * @Author: dongnan
 * @Description: 获取视角边界
 * @Date: 2021-07-31 10:31:07
 * @param {Viewer} viewer
 * @return {Array}  extent 范围
 */
function getExtent(viewer) {
	let rectangle = viewer.camera.computeViewRectangle();
	let extent = [
		CesiumMath.toDegrees(rectangle.west),
		CesiumMath.toDegrees(rectangle.south),
		CesiumMath.toDegrees(rectangle.east),
		CesiumMath.toDegrees(rectangle.north),
	];
	return extent;
}
/**
 * @Author: dongnan
 * @Description: 米转经纬度(EPSG:4326)
 * @Date: 2022-01-04 11:10:20
 * @param {*} meter
 */
function meterToDegree(meter) {
	let degree = (meter / (2 * Math.PI * 6371004)) * 360;
	return degree;
}
/**
 * @Author: dongnan
 * @Description: 经纬度转米(EPSG:4326)
 * @Date: 2022-01-04 13:54:05
 * @param {*} degree
 */
function degreeToMeter(degree) {
	let meter = (degree / 360) * (2 * Math.PI * 6371004);
	return meter;
}
