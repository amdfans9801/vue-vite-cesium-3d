import {
	PrimitiveCollection,
	BillboardCollection,
	defaultValue,
	Color,
	GeometryInstance,
	Material,
	PolylineMaterialAppearance,
	Cartesian3,
	VerticalOrigin,
	HorizontalOrigin,
	Cartesian2,
	DistanceDisplayCondition,
	NearFarScalar,
	GeoJsonDataSource,
	defined,
	GroundPolylinePrimitive,
	GroundPolylineGeometry,
} from "cesium";
import {
	drawDoubleImageCanvas,
	drawDoubleTextCanvas,
	drawSingleTextCanvas,
	drawTextCanvas,
} from "@/utils/cesium/CanvasLabel";
import { lineString, length as turfLength, lineSliceAlong } from "@turf/turf";
addMaterials();
/**
 * @Author: dongnan
 * @Description: 添加道路
 * @Date: 2021-12-14 14:51:23
 * @param {*} viewer
 * @param {*} data [{list:[[x,y],[x,y]],TextOptions:{},attributes:{},height:高度,lineWidth:线宽度,lineColor:线颜色}]
 * @param {*} saveData 存储
 * @param {*} subNum 分段数
 * @param {*} type 标签渲染方式 normal 或 cluster 默认cluster
 *
 */
export function addRoads(viewer, option) {
	if (!Array.isArray(option.data) || option.data.length == 0) return;
	let subNum = parseInt(defaultValue(option.subNum, 200));
	let lines = new PrimitiveCollection();
	let linePrimitive = viewer.scene.primitives.add(lines);
	let lableData = [];
	option.data.some((item, index) => {
		let list = item.list.clone();
		let height = defaultValue(item.height, 0);
		let lineWidth = defaultValue(item.lineWidth, 10);
		let lineColor = Color.fromCssColorString(
			defaultValue(item.lineColor, "#4fa9cb"),
		);
		let lineAlpha = defaultValue(item.lineAlpha, 1);
		let positions = DegreesToCartesians(list, height);
		lines.add(
			new GroundPolylinePrimitive({
				geometryInstances: new GeometryInstance({
					geometry: new GroundPolylineGeometry({
						positions: positions,
						width: lineWidth,
					}),
				}),
				appearance: new PolylineMaterialAppearance({
					material: Material.fromType("Color", {
						color: Color.WHITE.withAlpha(0.1),
					}),
				}),
			}),
		);
		lines.add(
			new GroundPolylinePrimitive({
				geometryInstances: new GeometryInstance({
					geometry: new GroundPolylineGeometry({
						positions: positions,
						width: lineWidth,
					}),
				}),
				appearance: new PolylineMaterialAppearance({
					material: Material.fromType("FlowLine", {
						color: lineColor.withAlpha(lineAlpha),
						speed: 10,
						image: require("@/assets/images/cesium/FlowLine.png"),
					}),
				}),
			}),
		);
		// 分段展示
		if (index > 0 && index % subNum == 0) {
			option.saveData.push({
				line: linePrimitive,
				type: "line",
			});
			lines = new PrimitiveCollection();
			linePrimitive = viewer.scene.primitives.add(lines);
		}
		// 整合标签数据
		let centerPoint =
			defined(item.TextOptions.center) &&
			Array.isArray(item.TextOptions.center)
				? item.TextOptions.center
				: CenterPolyline(list);
		let obj = {};
		obj.x = centerPoint[0];
		obj.y = centerPoint[1];
		obj.TextOptions = item.TextOptions;
		obj.attributes = item.attributes;
		lableData.push(obj);
	});

	// 总存储
	option.saveData.push({
		line: linePrimitive,
		type: "line",
	});
	// 添加标注数据
	addLabels(viewer, {
		data: lableData,
		type: defaultValue(option.type, "cluster"),
		saveData: option.saveData,
		subNum: option.subNum,
		Key: "RoadLine",
	});
}
/**
 * @Author: dongnan
 * @Description: 清除道路
 * @Date: 2021-12-14 15:09:34
 * @param {*} viewer
 * @param {*} saveData
 */
export function removeRoads(viewer, saveData) {
	saveData.some((item) => {
		if (item.type == "line") {
			viewer.scene.primitives.remove(item.line);
		} else if (item.type == "label") {
			if (item.kind == "normal") {
				viewer.scene.primitives.remove(item.primitive);
			} else if (item.kind == "cluster") {
				viewer.dataSources.remove(item.source);
			}
		}
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 添加所需材质
 * @Date: 2021-12-14 14:51:48
 * @param {*}
 */
function addMaterials() {
	let source = `
		uniform sampler2D image;
		uniform vec4 color;
		uniform float speed;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float t = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			vec2 st = materialInput.st;
			vec4 colorImage = texture2D(image, vec2(fract(st.s - t), st.t));
			material.alpha = colorImage.a * color.a;
			material.diffuse = color.rgb;
			return material;
		}`;
	Material._materialCache.addMaterial("FlowLine", {
		fabric: {
			type: "FlowLine",
			uniforms: {
				color: new Color(1.0, 0.0, 0.0, 0.5),
				image: require("@/assets/images/cesium/FlowLine.png"),
				speed: 20,
			},
			source: source,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 添加标注
 * @Date: 2021-10-21 16:11:07
 * @param {*} viewer
 * @param {*} type nromal cluster
 * @param {*} data 主要结构[{x:111,y:22,TextOptions:{},attributes:{}}]
 * TextOptions:{height:高度(单位:米),image:展示的背景图片,text:展示的文本,fontOptions:{},scale:缩放比例,offset:总偏移量(如:[0,0]),padding:[20,20,20,20](用于文字偏移背景图片),displayByDistance:[0,5000](距离显示条件),scaleByDistance:缩放大小随距离变化}
 * attributes 需要暴露给事件的信息
 * @param {*} clusterOptions 抽稀配置 {}
 * @param {*} saveData 存储数据
 * @param {*} subNum 分段数量
 * @param {*} Key 唯一标识
 */
function addLabels(viewer, option) {
	if (!Array.isArray(option.data) || option.data.length == 0) return;
	option.data = JSON.parse(JSON.stringify(option.data));
	let subNum = parseInt(defaultValue(option.subNum, 200));
	if (option.type == "normal") {
		let texts = new BillboardCollection();
		let textPrimitive = viewer.scene.primitives.add(texts);
		textPrimitive.Key = defaultValue(option.Key, "WmsLabel"); // 唯一标识 可触发点击事件
		option.data.some((item, index) => {
			if (
				typeof item.x == "undefined" ||
				typeof item.y == "undefined" ||
				!item.x ||
				!item.y
			)
				return false;
			// 显示文本时
			if (defined(item.TextOptions)) {
				if (defined(item.TextOptions.image)) {
					let image = new Image();
					image.src = item.TextOptions.image;
					image.onload = function () {
						let imageCanvas;
						if (
							defined(item.TextOptions.text2) &&
							!defined(item.TextOptions.image2)
						) {
							imageCanvas = drawDoubleTextCanvas(
								image,
								item.TextOptions,
							);
						} else {
							imageCanvas = drawSingleTextCanvas(
								image,
								item.TextOptions,
							);
						}
						if (defined(item.TextOptions.image2)) {
							let image2 = new Image();
							image2.src = item.TextOptions.image2;
							image2.onload = function () {
								let temp = texts.add({
									position: Cartesian3.fromDegrees(
										parseFloat(item.x),
										parseFloat(item.y),
										defaultValue(
											item.TextOptions.height,
											0,
										),
									),
									disableDepthTestDistance:
										Number.POSITIVE_INFINITY, //关闭深度检测
									image: drawDoubleImageCanvas(
										image,
										image2,
										item.TextOptions,
									),
									scale: defaultValue(
										item.TextOptions.scale,
										1,
									),
									verticalOrigin: VerticalOrigin.CENTER,
									horizontalOrigin: HorizontalOrigin.CENTER,
									pixelOffset: defined(
										item.TextOptions.offset,
									)
										? new Cartesian2(
												item.TextOptions.offset[0],
												item.TextOptions.offset[1],
										  )
										: new Cartesian2(0, 0),
									distanceDisplayCondition: defined(
										item.TextOptions.displayByDistance,
									)
										? new DistanceDisplayCondition(
												item.TextOptions.displayByDistance[0],
												item.TextOptions.displayByDistance[1],
										  )
										: new DistanceDisplayCondition(
												0,
												100000000,
										  ),
									scaleByDistance: defined(
										item.TextOptions.scaleByDistance,
									)
										? new NearFarScalar(
												item.TextOptions.scaleByDistance[0],
												item.TextOptions.scaleByDistance[1],
												item.TextOptions.scaleByDistance[2],
												item.TextOptions.scaleByDistance[3],
										  )
										: new NearFarScalar(0, 1, 1, 1),
								});
								temp.attributes = item.attributes;
							};
						} else {
							let temp = texts.add({
								position: Cartesian3.fromDegrees(
									parseFloat(item.x),
									parseFloat(item.y),
									defaultValue(item.TextOptions.height, 0),
								),
								disableDepthTestDistance:
									Number.POSITIVE_INFINITY, //关闭深度检测
								image: imageCanvas,
								scale: defaultValue(item.TextOptions.scale, 1),
								verticalOrigin: VerticalOrigin.CENTER,
								horizontalOrigin: HorizontalOrigin.CENTER,
								pixelOffset: defined(item.TextOptions.offset)
									? new Cartesian2(
											item.TextOptions.offset[0],
											item.TextOptions.offset[1],
									  )
									: new Cartesian2(0, 0),
								distanceDisplayCondition: defined(
									item.TextOptions.displayByDistance,
								)
									? new DistanceDisplayCondition(
											item.TextOptions.displayByDistance[0],
											item.TextOptions.displayByDistance[1],
									  )
									: new DistanceDisplayCondition(
											0,
											100000000,
									  ),
								scaleByDistance: defined(
									item.TextOptions.scaleByDistance,
								)
									? new NearFarScalar(
											item.TextOptions.scaleByDistance[0],
											item.TextOptions.scaleByDistance[1],
											item.TextOptions.scaleByDistance[2],
											item.TextOptions.scaleByDistance[3],
									  )
									: new NearFarScalar(0, 1, 1, 1),
							});
							temp.attributes = item.attributes;
						}
					};
				} else {
					let temp = texts.add({
						position: Cartesian3.fromDegrees(
							parseFloat(item.x),
							parseFloat(item.y),
							defaultValue(item.TextOptions.height, 0),
						),
						disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
						image: drawTextCanvas(item.TextOptions),
						scale: defaultValue(item.TextOptions.scale, 1),
						verticalOrigin: VerticalOrigin.CENTER,
						horizontalOrigin: HorizontalOrigin.CENTER,
						pixelOffset: defined(item.TextOptions.offset)
							? new Cartesian2(
									item.TextOptions.offset[0],
									item.TextOptions.offset[1],
							  )
							: new Cartesian2(0, 0),
						distanceDisplayCondition: defined(
							item.TextOptions.displayByDistance,
						)
							? new DistanceDisplayCondition(
									item.TextOptions.displayByDistance[0],
									item.TextOptions.displayByDistance[1],
							  )
							: new DistanceDisplayCondition(0, 100000000),
						scaleByDistance: defined(
							item.TextOptions.scaleByDistance,
						)
							? new NearFarScalar(
									item.TextOptions.scaleByDistance[0],
									item.TextOptions.scaleByDistance[1],
									item.TextOptions.scaleByDistance[2],
									item.TextOptions.scaleByDistance[3],
							  )
							: new NearFarScalar(0, 1, 1, 1),
					});
					temp.attributes = item.attributes;
				}
			}
			// 分段展示
			if (index > 0 && index % subNum == 0) {
				option.saveData.push({
					type: "label",
					kind: "normal",
					points: texts,
					primitive: textPrimitive,
				});
				texts = new BillboardCollection();
				textPrimitive = viewer.scene.primitives.add(texts);
				textPrimitive.Key = defaultValue(option.Key, "WmsLabel"); // 唯一标识 可触发点击事件
			}
		});
		// 存储
		option.saveData.push({
			type: "label",
			kind: "normal",
			points: texts,
			primitive: textPrimitive,
		});
	} else if (option.type == "cluster") {
		// 分段聚合 解决数据量过大
		while (Math.floor(option.data.length / subNum) >= 1) {
			let data = option.data.splice(0, subNum);
			clusterDataSource(viewer, {
				data: data,
				saveData: option.saveData,
				Key: option.Key,
			});
		}
		clusterDataSource(viewer, {
			data: option.data,
			saveData: option.saveData,
			Key: option.Key,
		});
	}
}
/**
 * @Author: dongnan
 * @Description: 聚合entity
 * @Date: 2021-10-22 10:34:06
 * @param {*} viewer
 * @param {*} data 主要结构[{x:111,y:22,TextOptions:{},attributes:{}}]
 * @param {*} clusterOptions
 * @param {*} saveData 数据存储
 * @param {*} Key 唯一标识
 */
function clusterDataSource(viewer, option) {
	let dataSourcePromise = viewer.dataSources.add(
		GeoJsonDataSource.load(toGeojson(option.data)),
	);
	dataSourcePromise.then(function (dataSource) {
		// 设置聚合范围
		let rangeOptions = defaultValue(option.clusterOptions, {
			pixelRange: 10,
			minimumClusterSize: 2,
		});
		let pixelRange = defaultValue(rangeOptions.pixelRange, 10);
		let minimumClusterSize = defaultValue(
			rangeOptions.minimumClusterSize,
			2,
		);
		dataSource.clustering.enabled = true;
		dataSource.clustering.pixelRange = pixelRange;
		dataSource.clustering.minimumClusterSize = minimumClusterSize;
		// 添加聚合数据
		let entities = dataSource.entities.values;
		entities.some((entity) => {
			// 唯一标识 可触发点击事件
			entity.Key = defaultValue(option.Key, "WmsLabel");
			let attr = entity.properties;
			entity.attributes = defined(attr.attributes)
				? attr.attributes._value
				: {};
			let val = entity.position._value;
			let TextOptions = attr.TextOptions._value;
			let height = defaultValue(TextOptions.height, 0.0);
			let position = new Cartesian3(val.x, val.y, val.z + height);
			entity.billboard.show = false;
			if (defined(TextOptions.image)) {
				let image = new Image();
				image.src = TextOptions.image;
				image.onload = function () {
					let imageCanvas;
					if (
						defined(TextOptions.text2) &&
						!defined(TextOptions.image2)
					) {
						imageCanvas = drawDoubleTextCanvas(image, TextOptions);
					} else {
						imageCanvas = drawSingleTextCanvas(image, TextOptions);
					}
					if (defined(TextOptions.image2)) {
						let image2 = new Image();
						image2.src = TextOptions.image2;
						image2.onload = function () {
							entity.position = position;
							entity.billboard = {
								show: true,
								disableDepthTestDistance:
									Number.POSITIVE_INFINITY, //关闭深度检测
								image: drawDoubleImageCanvas(
									image,
									image2,
									TextOptions,
								),
								scale: defaultValue(TextOptions.scale, 1),
								verticalOrigin: VerticalOrigin.CENTER,
								horizontalOrigin: HorizontalOrigin.CENTER,
								pixelOffset: defined(TextOptions.offset)
									? new Cartesian2(
											TextOptions.offset[0],
											TextOptions.offset[1],
									  )
									: new Cartesian2(0, 0),
								distanceDisplayCondition: defined(
									TextOptions.displayByDistance,
								)
									? new DistanceDisplayCondition(
											TextOptions.displayByDistance[0],
											TextOptions.displayByDistance[1],
									  )
									: new DistanceDisplayCondition(
											0,
											100000000,
									  ),
								scaleByDistance: defined(
									TextOptions.scaleByDistance,
								)
									? new NearFarScalar(
											TextOptions.scaleByDistance[0],
											TextOptions.scaleByDistance[1],
											TextOptions.scaleByDistance[2],
											TextOptions.scaleByDistance[3],
									  )
									: new NearFarScalar(0, 1, 1, 1),
							};
						};
					} else {
						entity.position = position;
						entity.billboard = {
							show: true,
							disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
							image: imageCanvas,
							scale: defaultValue(TextOptions.scale, 1),
							verticalOrigin: VerticalOrigin.CENTER,
							horizontalOrigin: HorizontalOrigin.CENTER,
							pixelOffset: defined(TextOptions.offset)
								? new Cartesian2(
										TextOptions.offset[0],
										TextOptions.offset[1],
								  )
								: new Cartesian2(0, 0),
							distanceDisplayCondition: defined(
								TextOptions.displayByDistance,
							)
								? new DistanceDisplayCondition(
										TextOptions.displayByDistance[0],
										TextOptions.displayByDistance[1],
								  )
								: new DistanceDisplayCondition(0, 100000000),
							scaleByDistance: defined(
								TextOptions.scaleByDistance,
							)
								? new NearFarScalar(
										TextOptions.scaleByDistance[0],
										TextOptions.scaleByDistance[1],
										TextOptions.scaleByDistance[2],
										TextOptions.scaleByDistance[3],
								  )
								: new NearFarScalar(0, 1, 1, 1),
						};
					}
				};
			} else {
				entity.position = position;
				entity.billboard = {
					show: true,
					disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
					image: drawTextCanvas(TextOptions),
					scale: defaultValue(TextOptions.scale, 1),
					verticalOrigin: VerticalOrigin.CENTER,
					horizontalOrigin: HorizontalOrigin.CENTER,
					pixelOffset: defined(TextOptions.offset)
						? new Cartesian2(
								TextOptions.offset[0],
								TextOptions.offset[1],
						  )
						: new Cartesian2(0, 0),
					distanceDisplayCondition: defined(
						TextOptions.displayByDistance,
					)
						? new DistanceDisplayCondition(
								TextOptions.displayByDistance[0],
								TextOptions.displayByDistance[1],
						  )
						: new DistanceDisplayCondition(0, 100000000),
					scaleByDistance: defined(TextOptions.scaleByDistance)
						? new NearFarScalar(
								TextOptions.scaleByDistance[0],
								TextOptions.scaleByDistance[1],
								TextOptions.scaleByDistance[2],
								TextOptions.scaleByDistance[3],
						  )
						: new NearFarScalar(0, 1, 1, 1),
				};
			}
		});
		// 监听聚合事件 更改聚合后样式
		let clusterEvent = function (entities, cluster) {
			cluster.label.show = false;
			cluster.billboard.show = false;
		};
		dataSource.clustering.clusterEvent.addEventListener(clusterEvent);
		// 存储
		option.saveData.push({
			type: "label",
			kind: "cluster",
			points: entities,
			source: dataSource,
			event: clusterEvent,
		});
	});
}
/**
 * @Author: dongnan
 * @Description: 转换成geojson格式
 * @Date: 2021-01-29 15:10:33
 */
function toGeojson(list) {
	let jsons = [];
	for (let obj of list) {
		let json = {
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [parseFloat(obj.x), parseFloat(obj.y)],
			},
			properties: obj,
		};
		jsons.push(json);
	}
	let geojson = {
		type: "FeatureCollection",
		features: jsons,
	};
	return geojson;
}
/**
 * @Author: dongnan
 * @Description: 经纬度坐标转世界坐标
 * @Date: 2021-08-24 14:24:44
 * @param {*} list
 * @param {*} height
 */
function DegreesToCartesians(list, height) {
	let result = [];
	list.forEach((item) => {
		result.push(
			new Cartesian3.fromDegrees(
				parseFloat(item[0]),
				parseFloat(item[1]),
				height,
			),
		);
	});
	return result;
}
/**
 * @Author: dongnan
 * @Description: 线中点
 * @Date: 2021-12-15 16:09:10
 * @param {*} list
 */
function CenterPolyline(list) {
	let line = lineString(list);
	let length = turfLength(line, { units: "kilometers" });
	let start = length / 2 - 0.001;
	let stop = start + 0.002;
	var sliced = lineSliceAlong(line, start, stop, { units: "kilometers" });
	return sliced.geometry.coordinates[0];
}
