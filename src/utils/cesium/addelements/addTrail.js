import {
	SampledPositionProperty,
	JulianDate,
	Cartesian3,
	VerticalOrigin,
	HorizontalOrigin,
	PolylineDashMaterialProperty,
	Color,
	defaultValue,
	PolylineGlowMaterialProperty,
	Cartographic,
	EllipsoidGeodesic,
} from "cesium";
import { lineString as turfLineString, bbox as turfBBox } from "@turf/turf";
import { zoomToExtent } from "@/utils/cesium/CameraTool";
/**
 * @Author: dongnan
 * @Description: 加载轨迹
 * @Date: 2021-08-11 13:42:44
 * @param {*} viewer
 * @param {*} list 轨迹数据[[lon,lat],[lon,lat]]
 * @param {*} image 图标地址
 * @param {*} height 高度
 * @param {*} speed 速度 秒
 * @param {*} saveData 存储数据 [{point: 点entity实体,line: 线entity实体,event: preUpdate事件对象}]
 * @param return
 */
export function addEntityTrail(viewer, option) {
	if (!Array.isArray(option.list) || option.list.length < 2) return;
	// 定位
	let extent = turfBBox(turfLineString(option.list));
	zoomToExtent(viewer, {
		extent: extent,
	});
	// 轨迹绘制
	let height = defaultValue(option.height, 0);
	let speed = defaultValue(option.speed, 3);
	let data = calculateSpeed(option.list, height, speed);
	let positions = data.positions;
	let speedList = data.speedList;
	let timeSum = 0;
	let positionInterpolation = new SampledPositionProperty();
	let startTime = JulianDate.fromDate(new Date());
	positions.some((item, index) => {
		positionInterpolation.addSample(
			JulianDate.addSeconds(startTime, timeSum, new JulianDate()),
			item,
		);
		if (index < option.list.length - 1) {
			timeSum += speedList[index];
		}
	});
	let stopTime = JulianDate.addSeconds(startTime, timeSum, new JulianDate());
	let startPosition = Cartesian3.fromDegrees(
		option.list[0][0],
		option.list[0][1],
		height,
	);
	let endPosition = Cartesian3.fromDegrees(
		option.list[option.list.length - 1][0],
		option.list[option.list.length - 1][1],
		height,
	);
	let pointEntity = viewer.entities.add({
		position: startPosition.clone(),
		billboard: {
			image: option.image,
			scale: 0.5,
			verticalOrigin: VerticalOrigin.BOTTOM,
			horizontalOrigin: HorizontalOrigin.CENTER,
			disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
		},
	});
	let startPoint = viewer.entities.add({
		position: startPosition.clone(),
		billboard: {
			image: require("@/assets/images/cesium/startPoint.png"),
			verticalOrigin: VerticalOrigin.BOTTOM,
			horizontalOrigin: HorizontalOrigin.CENTER,
			disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
		},
	});
	let endPoint = viewer.entities.add({
		position: endPosition.clone(),
		billboard: {
			image: require("@/assets/images/cesium/endPoint.png"),
			verticalOrigin: VerticalOrigin.BOTTOM,
			horizontalOrigin: HorizontalOrigin.CENTER,
			disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
		},
	});
	let linePath = viewer.entities.add({
		position: positionInterpolation,
		name: "path",
		path: {
			show: true,
			leadTime: 0,
			trailTime: 0.3,
			width: 10,
			resolution: 1,
			material: new PolylineGlowMaterialProperty({
				glowPower: 0.3,
				taperPower: 0.3,
				color: Color.CYAN,
			}),
		},
	});
	let lineEntity = viewer.entities.add({
		polyline: {
			positions: positions,
			width: 3,
			material: new PolylineDashMaterialProperty({
				color: Color.YELLOWGREEN,
			}),
			clampToGround: true,
		},
	});
	let animateEvent = function (scene, time) {
		if (
			JulianDate.compare(stopTime, time) > 0 &&
			JulianDate.compare(stopTime, time) <= 0.1
		) {
			pointEntity.position._value = endPosition.clone();
			viewer.scene.preUpdate.removeEventListener(animateEvent);
			return;
		} else {
			let position = positionInterpolation.getValue(time);
			if (typeof position == "undefined") {
				return;
			}
			pointEntity.position._value = position;
		}
	};
	viewer.scene.preUpdate.addEventListener(animateEvent);
	viewer.clock.currentTime = startTime.clone();
	// 存储
	option.saveData.push({
		entities: [startPoint, endPoint, pointEntity, linePath, lineEntity],
		event: animateEvent,
	});
}
/**
 * @Author: dongnan
 * @Description: 移除轨迹
 * @Date: 2021-11-13 15:48:07
 * @param {*} viewer
 * @param {*} saveData
 */
export function removeEntityTrail(viewer, saveData) {
	saveData.some((item) => {
		viewer.scene.preUpdate.removeEventListener(item.event);
		item.entities.some((temp) => {
			viewer.entities.remove(temp);
		});
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 计算速度
 * @Date: 2021-11-13 19:18:30
 * @param {*} list
 * @param {*} height
 * @param {*} speed
 */
function calculateSpeed(list, height, speed) {
	let positions = [];
	let lengthList = [];
	let speedList = [];
	let totalLength = 0;
	list.some((item, index) => {
		let position = Cartesian3.fromDegrees(
			parseFloat(item[0]),
			parseFloat(item[1]),
			height,
		);
		positions.push(position);
		if (index < list.length - 1) {
			let endPosition = Cartesian3.fromDegrees(
				parseFloat(list[index + 1][0]),
				parseFloat(list[index + 1][1]),
				height,
			);
			let length = getLineDistance(position, endPosition);
			lengthList.push(length);
			totalLength += length;
		}
	});
	lengthList.some((item) => {
		let newSpeed = (speed * item) / totalLength;
		speedList.push(newSpeed);
	});
	return {
		positions: positions,
		speedList: speedList,
	};
}
/**
 * @Author: dongnan
 * @Description: 获取俩点的距离，返回公里单位值
 * @Date: 2021-01-14 11:35:27
 * @param {*} startPoint
 * @param {*} endPoint
 */
function getLineDistance(startPoint, endPoint) {
	let startCartographic = Cartographic.fromCartesian(startPoint);
	let endCartographic = Cartographic.fromCartesian(endPoint);
	let geodesic = new EllipsoidGeodesic();
	geodesic.setEndPoints(startCartographic, endCartographic);
	let surfaceDistance = geodesic.surfaceDistance;
	let lengthInMeters = Math.sqrt(
		Math.pow(surfaceDistance, 2) +
			Math.pow(endCartographic.height - startCartographic.height, 2),
	);
	return lengthInMeters;
}
