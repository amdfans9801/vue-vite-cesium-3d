import {
	ScreenSpaceEventHandler,
	HorizontalOrigin,
	VerticalOrigin,
	Color,
	Cartesian2,
	ScreenSpaceEventType,
	Ellipsoid,
	Cartesian3,
	Math as CesiumMath,
	Cartographic,
	EllipsoidGeodesic,
	CallbackProperty,
	defined,
	PolylineDashMaterialProperty,
	PolygonHierarchy,
	BoundingSphere,
	defaultValue,
	ClassificationType,
	PolylineGlowMaterialProperty,
	HeightReference,
} from "cesium";
import getAssets from "@/utils/tools/getAssets";
/**
 * @Author: dongnan
 * @Description: 辅助绘制点、线、面
 * @Date: 2021-11-11 15:30:10
 * @param {*} viewer
 */
export default class DrawTool {
	constructor(option) {
		this.viewer = option.viewer;
		this.handler = null; //绑定帮手 destory()销毁
		this.MeasureEntities = []; //存储所有entity数据
		// 提示框
		this.CesiumTooltip = new TooltipLabel({ viewer: option.viewer });
		//去锯齿 是文字清晰
		this.viewer.scene.postProcessStages.fxaa.enabled = false;
		// 线
		this.totalDistance = 0; //总距离
	}
	/**
	 * @Author: dongnan
	 * @Description: 画点
	 * @Date: 2021-06-03 13:36:05
	 */
	drawPoint(callback) {
		// 获取事件处理工具
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 局部参数
		let point = null;
		//绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			let object = cartesian3ToDegrees(cartesian);
			let text = object.text;
			cartesian = object.cartesian;
			// 添加撒点
			this.MeasureEntities.push(
				this.viewer.entities.add({
					position: cartesian,
					billboard: {
						image: getAssets("images/cesium/point.png"),
						// image: require("@/assets/images/cesium/point.png"),
						// image: new URL("./assets/point.png", import.meta.url).href,
						horizontalOrigin: HorizontalOrigin.CENTER,
						verticalOrigin: VerticalOrigin.BOTTOM,
					},
				}),
			);
			if (typeof callback == "function") callback(cartesian);
		}, ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (point) {
				this.CesiumTooltip.showAt(cartesian, "右击结束");
			} else {
				this.CesiumTooltip.showAt(cartesian, "点击测量点坐标");
			}
			if (!point) {
				point = new PointEntity({
					viewer: this.viewer,
					position: cartesian,
					saveData: this.MeasureEntities,
				});
			} else {
				// 更新数据
				point.position = cartesian;
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);
		//绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 清除点
			point.clear();
			this.stopDraw();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画点
	 * @Date: 2021-06-03 13:36:05
	 */
	drawSinglePoint(callback, showPoint) {
		// 获取事件处理工具
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 局部参数
		let point = null;
		let pointEntity = null;
		//绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			let object = cartesian3ToDegrees(cartesian);
			let text = object.text;
			cartesian = object.cartesian;
			// 添加撒点
			point = cartesian;
			if (showPoint) {
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: cartesian,
						billboard: {
							// image: require("@/assets/images/cesium/point.png"),
							image: getAssets("images/cesium/point.png"),
							// image: new URL("./assets/point.png", import.meta.url).href,
							horizontalOrigin: HorizontalOrigin.CENTER,
							verticalOrigin: VerticalOrigin.BOTTOM,
						},
					}),
				);
			}
			if (typeof callback == "function") callback(cartesian);
		}, ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (point) {
				this.CesiumTooltip.showAt(cartesian, "点击更新位置,右击结束");
			} else {
				this.CesiumTooltip.showAt(cartesian, "点击测量点坐标");
			}

			if (!pointEntity) {
				pointEntity = new PointEntity({
					viewer: this.viewer,
					position: cartesian,
					saveData: this.MeasureEntities,
				});
			} else {
				// 更新数据
				pointEntity.position = cartesian;
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);
		//绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 清除点
			pointEntity.clear();
			this.stopDraw();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画线
	 * @Date: 2021-05-31 14:27:42
	 */
	drawLine(callback) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 实线的点
		let movePositions = []; //虚线的点
		let polyLine = null; //全局变量、默认空
		this.totalDistance = 0;
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			if (positions.length == 0) {
				// 初始存储两点 便于move事件使用
				positions.push(cartesian);
				positions.push(cartesian.clone());
				movePositions.push(cartesian);
				movePositions.push(cartesian.clone());
				// 添加初始点entity
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: cartesian,
						point: {
							pixelSize: 10,
							color: Color.GREEN,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
						},
					}),
				);
			} else {
				// 去除positions初始赋予的重复值,保证点的纯净
				if (positions[0] === movePositions[0]) {
					positions.splice(0, 1);
				}
				// 数据重新存储
				let moveEndPosition = movePositions[1];
				positions.push(moveEndPosition);
				movePositions = [moveEndPosition, moveEndPosition.clone()];
				// 更新线数据
				polyLine.positions = positions;
				polyLine.movePositions = movePositions;
				// 添加中间点
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: positions[positions.length - 1],
						point: {
							pixelSize: 10,
							color: Color.YELLOW,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
						},
					}),
				);
			}
		}, ScreenSpaceEventType.LEFT_CLICK);
		//绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (positions.length == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (positions.length >= 2) {
				this.CesiumTooltip.showAt(cartesian, "右击结束");
				if (!defined(polyLine)) {
					polyLine = new PolyLineEntity({
						viewer: this.viewer,
						positions: positions,
						movePositions: movePositions,
						saveData: this.MeasureEntities,
					});
				} else {
					movePositions.pop();
					movePositions.push(cartesian);
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);
		// 绑定鼠标右键事件
		this.handler.setInputAction((movement) => {
			// 添加结束实线并清除虚线
			positions.push(movePositions[1]);
			polyLine.positions = positions;
			polyLine.clear();
			// 添加结束点
			this.MeasureEntities.push(
				this.viewer.entities.add({
					position: positions[positions.length - 1],
					point: {
						pixelSize: 10,
						color: Color.RED,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
					},
				}),
			);
			if (typeof callback == "function") callback(positions);
			// 事件销毁
			this.stopDraw();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画面
	 * @Date: 2021-05-31 14:27:51
	 */
	drawPolygon(callback) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; // 全部点
		let polyGonPoints = []; //真实点
		let polyGon = null; //全局变量、默认空
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			if (positions.length == 0) {
				// 初始存储数据
				positions.push(cartesian);
				positions.push(cartesian.clone());
				// 真实点存储
				polyGonPoints.push(cartesian);
				// 添加点
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: polyGonPoints[polyGonPoints.length - 1],
						point: {
							pixelSize: 10,
							color: Color.GREEN,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
							heightReference: HeightReference.CLAMP_TO_GROUND,
						},
					}),
				);
			} else {
				// 数据更新
				let moveEndPosition = positions[positions.length - 1];
				polyGonPoints.push(moveEndPosition);
				positions = polyGonPoints.concat(moveEndPosition.clone());
				polyGon.positions = positions;
				// 添加点
				this.MeasureEntities.push(
					this.viewer.entities.add({
						position: polyGonPoints[polyGonPoints.length - 1],
						point: {
							pixelSize: 10,
							color: Color.YELLOW,
							disableDepthTestDistance: Number.POSITIVE_INFINITY,
							heightReference: HeightReference.CLAMP_TO_GROUND,
						},
					}),
				);
			}
		}, ScreenSpaceEventType.LEFT_CLICK);
		// 绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (positions.length == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (positions.length >= 2) {
				if (polyGonPoints.length == 1) {
					this.CesiumTooltip.showAt(cartesian, "点击添加第二个点");
				} else {
					this.CesiumTooltip.showAt(cartesian, "右击结束");
				}
				if (!defined(polyGon)) {
					polyGon = new PolygonEntity({
						viewer: this.viewer,
						positions: positions,
						saveData: this.MeasureEntities,
					});
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);
		// 绑定鼠标右击事件
		this.handler.setInputAction((movement) => {
			// 更新面数据
			let moveEndPosition = positions[positions.length - 1];
			polyGonPoints.push(moveEndPosition);
			polyGon.positions = polyGonPoints;
			polyGon.clear();
			// 添加点
			this.MeasureEntities.push(
				this.viewer.entities.add({
					position: polyGonPoints[polyGonPoints.length - 1],
					point: {
						pixelSize: 10,
						color: Color.RED,
						disableDepthTestDistance: Number.POSITIVE_INFINITY,
						heightReference: HeightReference.CLAMP_TO_GROUND,
					},
				}),
			);
			if (typeof callback == "function") callback(polyGonPoints);
			// 事件销毁
			this.stopDraw();
		}, ScreenSpaceEventType.RIGHT_CLICK);
	}
	/**
	 * @Author: dongnan
	 * @Description: 画圆
	 * @Date: 2021-06-03 16:37:59
	 */
	drawCircle(callback) {
		this.stopDraw();
		// 获取事件处理工具
		this.handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		// 初始化局部参数
		let positions = []; //点集合
		let clickNum = 0; //点击次数
		let circle = null; //全局变量、默认空
		// 绑定鼠标点击事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.position);
			if (!cartesian) return;
			if (clickNum == 0) {
				positions.push(cartesian);
				positions.push(cartesian.clone());
			} else if (clickNum == 1) {
				positions = [positions[0]].concat([positions[positions.length - 1]]);
				circle.positions = positions;
				circle.clear();
				if (typeof callback == "function") callback(positions[0], circle.radius);
				this.stopDraw();
			}
			clickNum += 1;
		}, ScreenSpaceEventType.LEFT_UP);
		// 绑定鼠标移动事件
		this.handler.setInputAction((movement) => {
			let cartesian = this.viewer.scene.pickPosition(movement.endPosition);
			if (!cartesian) return;
			if (clickNum == 0) {
				this.CesiumTooltip.showAt(cartesian, "点击添加第一个点");
			} else if (clickNum >= 1) {
				this.CesiumTooltip.showAt(cartesian, "点击完成绘制");
				if (!defined(circle)) {
					circle = new CircleEntity({
						viewer: this.viewer,
						positions: positions,
						saveData: this.MeasureEntities,
					});
				} else {
					positions.pop();
					positions.push(cartesian);
				}
			}
		}, ScreenSpaceEventType.MOUSE_MOVE);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-05-31 14:59:33
	 */
	clear() {
		// 去除事件
		this.stopDraw();
		// 去除数据
		this.MeasureEntities.some((item) => {
			if (item) {
				this.viewer.entities.remove(item);
			}
		});
		this.MeasureEntities = [];
	}
	/**
	 * @Author: dongnan
	 * @Description: 结束绘制
	 * @Date: 2021-05-31 14:44:07
	 */
	stopDraw() {
		// 去除事件
		if (this.handler) {
			this.handler.destroy();
			this.handler = null;
		}
		// 隐藏提示框
		this.CesiumTooltip.setVisible(false);
	}
}
/**
 * @Author: dongnan
 * @Description: 提示标签
 * @Date: 2021-11-11 15:27:46
 * @param {*} viewer
 */
class TooltipLabel {
	constructor(option) {
		this.viewer = option.viewer;
		this.labelEntity = this.viewer.entities.add({
			position: Cartesian3.fromDegrees(0, 0),
			label: {
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				text: "提示",
				font: "24px Microsoft YaHei",
				scale: 0.5,
				fillColor: Color.WHITE,
				pixelOffset: new Cartesian2(8, 8),
				horizontalOrigin: HorizontalOrigin.LEFT,
				showBackground: true,
				backgroundPadding: new Cartesian2(4, 8),
				backgroundColor: new Color(0, 0, 0, 0.5),
			},
		});
		this.labelEntity.show = false;
	}
	/**
	 * @Author: dongnan
	 * @Description: 设置显示隐藏
	 * @Date: 2021-11-11 15:27:25
	 * @param {*} visible
	 */
	setVisible(visible) {
		this.labelEntity.show = visible ? true : false;
	}
	/**
	 * @Author: dongnan
	 * @Description: 展示位置
	 * @Date: 2021-11-11 15:27:33
	 * @param {*} position
	 * @param {*} message
	 */
	showAt(position, message) {
		if (position && message) {
			this.labelEntity.position = position;
			this.labelEntity.show = true;
			this.labelEntity.label.text = message;
		} else {
			this.labelEntity.show = false;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 点Entity
 * @Date: 2021-11-11 15:47:18
 * @param {*} viewer
 * @param {*} position
 * @param {*} saveData
 */
class PointEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.position = option.position;
		this.saveData = option.saveData;
		this.movePoint = this.viewer.entities.add({
			position: new CallbackProperty(() => {
				return this.position;
			}, false),
			point: {
				pixelSize: 8,
				color: Color.TRANSPARENT,
				outlineColor: Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description:
	 * @Date: 2021-11-11 15:45:04
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 线Entity
 * @Date: 2021-11-11 16:44:10
 * @param {*} viewer
 * @param {*} positions
 * @param {*} movePositions
 * @param {*} saveData
 */
class PolyLineEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.saveData = option.saveData;
		//实线点位
		this.positions = option.positions;
		//虚线点位
		this.movePositions = option.movePositions;
		//实线实体
		this.polyLine = this.viewer.entities.add({
			name: "实线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => {
					return this.positions;
				}, false),
				material: Color.BLACK,
				width: 3,
				clampToGround: true,
			},
		});
		//虚线实体
		this.movePolyLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => {
					return this.movePositions;
				}, false),
				material: new PolylineDashMaterialProperty({
					color: Color.BLACK,
				}),
				width: 3,
				clampToGround: true,
			},
		});
		//点实体
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new CallbackProperty(() => {
				return this.movePositions[1];
			}, false),
			point: {
				pixelSize: 8,
				color: Color.TRANSPARENT,
				outlineColor: Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});
		this.saveData.push(this.polyLine);
		this.saveData.push(this.movePolyLine);
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 16:49:50
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 面Entity
 * @Date: 2021-11-11 21:02:48
 * @param {*} viewer
 * @param {*} positions
 * @param {*} saveData
 */
class PolygonEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.positions = option.positions; //全部点位
		this.saveData = option.saveData;
		this.polyGon = this.viewer.entities.add({
			name: "多边形",
			polygon: {
				show: true,
				hierarchy: new CallbackProperty(() => {
					return new PolygonHierarchy(this.positions);
				}, false),
				material: Color.BLUE.withAlpha(0.4),
				classificationType: ClassificationType.BOTH,
				zIndex: 0,
			},
		});
		this.moveLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => {
					let positions = [];
					if (this.positions.length >= 3) {
						positions = this.positions.concat([this.positions[0].clone()]);
					} else {
						positions = this.positions;
					}
					return positions;
				}, false),
				material: new PolylineDashMaterialProperty({
					color: Color.BLACK,
				}),
				width: 3,
				clampToGround: true,
				zIndex: 1,
				classificationType: ClassificationType.BOTH,
			},
		});
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new CallbackProperty(() => {
				return this.positions[this.positions.length - 1];
			}, false),
			point: {
				pixelSize: 8,
				color: Color.TRANSPARENT,
				outlineColor: Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				heightReference: HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.polyGon);
		this.saveData.push(this.moveLine);
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 21:11:23
	 * @param {*}
	 */
	clear() {
		this.moveLine.polyline.material = new PolylineGlowMaterialProperty({
			color: Color.CYAN,
			glowPower: 0.25,
			taperPower: 1,
		});
		this.moveLine.polyline.width._value = 5;
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 圆Entity
 * @Date: 2021-11-11 21:42:25
 * @param {*} viewer
 * @param {*} positions
 * @param {*} height
 * @param {*} saveData
 */
class CircleEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.positions = option.positions;
		this.saveData = option.saveData;
		this.meters = 0;

		this.circle = this.viewer.entities.add({
			name: "圆",
			position: this.positions[0],
			ellipse: {
				semiMinorAxis: new CallbackProperty(() => {
					let meters = getLineDistance(this.positions[0], this.positions[1]);
					if (!meters) meters = 1;
					this.radius = meters;
					return meters;
				}, false),
				semiMajorAxis: new CallbackProperty(() => {
					let meters = getLineDistance(this.positions[0], this.positions[1]);
					if (!meters) meters = 1;
					return meters;
				}, false),
				material: Color.BLUE.withAlpha(0.4),
				outline: true,
				outlineColor: Color.CYAN,
				outlineWidth: 10,
				granularity: CesiumMath.RADIANS_PER_DEGREE,
				classificationType: ClassificationType.BOTH,
				heightReference: HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.movePolyLine = this.viewer.entities.add({
			name: "虚线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => {
					return this.positions;
				}, false),
				material: new PolylineDashMaterialProperty({
					color: Color.BLACK,
				}),
				width: 3,
				clampToGround: true,
				classificationType: ClassificationType.BOTH,
			},
		});
		this.movePoint = this.viewer.entities.add({
			name: "点",
			position: new CallbackProperty(() => {
				return this.positions[1];
			}, false),
			point: {
				pixelSize: 8,
				color: Color.TRANSPARENT,
				outlineColor: Color.BLACK,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
				heightReference: HeightReference.CLAMP_TO_GROUND,
			},
		});
		this.saveData.push(this.circle);
		this.saveData.push(this.movePoint);
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2021-11-11 21:46:55
	 * @param {*}
	 */
	clear() {
		this.viewer.entities.remove(this.movePolyLine);
		this.viewer.entities.remove(this.movePoint);
	}
}
/**
 * @Author: dongnan
 * @Description: 改变笛卡尔坐标高度
 * @Date: 2021-05-31 16:20:14
 * @param {*} cartesian
 * @param {*} height
 */
function cartesianWithHeight(cartesian, height) {
	height = defaultValue(height, 0);
	let cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
	return Cartesian3.fromDegrees((cartographic.longitude / Math.PI) * 180, (cartographic.latitude / Math.PI) * 180, height);
}
/**
 * @Author: dongnan
 * @Description: 笛卡尔坐标转经纬度坐标
 * @Date: 2021-06-03 14:53:05
 * @param {*} cartesian
 */
function cartesian3ToDegrees(cartesian) {
	let cartographic = Ellipsoid.WGS84.cartesianToCartographic(cartesian);
	let lon = CesiumMath.toDegrees(cartographic.longitude);
	let lat = CesiumMath.toDegrees(cartographic.latitude);
	let height = cartographic.height;
	if (height < 0) {
		height = 0;
		cartesian = cartesianWithHeight(cartesian, 0);
	}
	let text = "经纬度:" + lon.toFixed(2) + " , " + lat.toFixed(2) + "   海拔:" + height.toFixed(2) + "m";

	return { text: text, cartesian: cartesian, lon: lon, lat: lat };
}
/**
 * @Author: dongnan
 * @Description: 获取俩点的距离，返回m
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
	let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));
	return parseFloat(lengthInMeters);
}
/**
 * @Author: dongnan
 * @Description: 微元法求面积 m²
 * @Date: 2021-01-15 16:35:41
 * @param {*} cartesians 笛卡尔坐标数组
 */
function countAreaInCartesian3(cartesians) {
	//拆分三角曲面
	let area = 0;
	let lonLatPoints = cartesianToLonLat(cartesians);
	for (let i = 0; i < lonLatPoints.length - 2; i++) {
		let j = (i + 1) % lonLatPoints.length;
		let k = (i + 2) % lonLatPoints.length;
		let totalAngle = Angle(lonLatPoints[i], lonLatPoints[j], lonLatPoints[k]);
		let dis_temp1 = getLineDistance(cartesians[i], cartesians[j]);
		let dis_temp2 = getLineDistance(cartesians[j], cartesians[k]);
		area += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
	}
	return area;
	/**
	 * @Author: dongnan
	 * @Description: 笛卡尔坐标数组转为[{lon:111.23,lat:23.34,height:height}]
	 * @Date: 2021-06-04 22:41:15
	 * @param {*} cartesians
	 */
	function cartesianToLonLat(cartesians) {
		let result = [];
		for (let cartesian of cartesians) {
			let cartographic = Cartographic.fromCartesian(cartesian);
			let lon = CesiumMath.toDegrees(cartographic.longitude);
			let lat = CesiumMath.toDegrees(cartographic.latitude);
			let height = cartographic.height;
			result.push({
				lon: lon,
				lat: lat,
				height: height,
			});
		}
		return result;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算三角形角度
	 * @Date: 2021-06-04 22:35:26
	 * @param {*} p1
	 * @param {*} p2
	 * @param {*} p3
	 */
	function Angle(p1, p2, p3) {
		let bearing21 = Bearing(p2, p1);
		let bearing23 = Bearing(p2, p3);
		let angle = bearing21 - bearing23;
		if (angle < 0) {
			angle += 360;
		}
		return angle;
		/**
		 * @Author: dongnan
		 * @Description: 计算两点方向
		 * @Date: 2021-06-04 22:35:00
		 * @param {*} from
		 * @param {*} to
		 */
		function Bearing(from, to) {
			let radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad)
			let degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度
			let lat1 = from.lat * radiansPerDegree;
			let lon1 = from.lon * radiansPerDegree;
			let lat2 = to.lat * radiansPerDegree;
			let lon2 = to.lon * radiansPerDegree;
			let angle = -Math.atan2(
				Math.sin(lon1 - lon2) * Math.cos(lat2),
				Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2),
			);
			if (angle < 0) {
				angle += Math.PI * 2.0;
			}
			angle = angle * degreesPerRadian; //角度
			return angle;
		}
	}
}
/**
 * @Author: dongnan
 * @Description: 传入整数米
 * @Date: 2021-06-05 16:11:56
 * @param {*} num
 */
function labelLineTransform(num) {
	let str = String(num);
	let text = "";
	if (str.length < 4) {
		text = str + " m";
	} else {
		if (str.length < 8) {
			str = String(str / 1000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " km";
		} else {
			str = String(str / 10000000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " 万km";
		}
	}
	return text;
}
/**
 * @Author: dongnan
 * @Description: 传入整数平方米 m²
 * @Date: 2021-06-05 16:11:56
 * @param {*} num
 */
function labelAreaTransform(num) {
	let str = String(num);
	let text = "";
	if (str.length < 5) {
		text = str + " ㎡";
	} else {
		if (str.length < 7) {
			str = String(str / 10000);
			str = str.substr(0, str.indexOf(".", 0) + 3);
			text = str + " h㎡";
		} else {
			if (str.length < 11) {
				str = String(str / 1000000);
				str = str.substr(0, str.indexOf(".", 0) + 3);
				text = str + " k㎡";
			} else {
				str = String(str / 10000000000);
				str = str.substr(0, str.indexOf(".", 0) + 3);
				text = str + " 万k㎡";
			}
		}
	}
	return text;
}
