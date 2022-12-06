import {
	PrimitiveCollection,
	BillboardCollection,
	defaultValue,
	Primitive,
	GeometryInstance,
	WallGeometry,
	MaterialAppearance,
	Material,
	Color,
	defined,
	VerticalOrigin,
	HorizontalOrigin,
	Cartesian2,
	DistanceDisplayCondition,
	NearFarScalar,
	Cartesian3,
	Matrix4,
	Matrix3,
	Math as CesiumMath,
	Transforms,
	CylinderGeometry,
	ColorGeometryInstanceAttribute,
	BlendingState,
	Appearance,
} from "cesium";
import { lineString as turfLineString, bbox as turfBBox, polygon as turfPolygon, pointOnFeature, transformRotate } from "@turf/turf";
addMaterial(); //添加材质
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2021-08-25 12:20:02
 * @param {*} viewer
 * @param {*} data [{list:[],baseHeight:0,wallHeight:120,TextOptions:{},attributes:{},MaterialTypes:["WallType1","WallType2"]}]
 * @param {*} saveData 存储数据
 * TextOptions:{image:展示的背景图片,text:展示的文本,fontOptions:{}(文档writeTextToCanvas配置项),scale:缩放比例,offset:总偏移量(如:[0,0]),padding:[20,20,20,20](用于文字偏移背景图片),displayByDistance:[0,5000](距离显示条件)}
 * TextOptions3D:{width:(米),list:(点位),offset:(标签偏移),image:展示的背景图片,text:展示的文本,fontOptions:{},padding:[20,20,20,20](用于文字偏移背景图片)}
 * TextOptions3D.sign:{radius(半径),length(长度),offset:上下偏移,angle:左右旋转角度}
 * @param return  bbox 范围
 */
export function addPrimitiveWalls(viewer, option) {
	if (!Array.isArray(option.data) || option.data.length == 0) return;
	// 材质列表
	const WallMaterialTypeObject = (type, color) => {
		let material;
		let wallColor = defaultValue(color, Color.AQUA);
		switch (type) {
			case "WallType1":
				material = Material.fromType("WallType1", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage1.png"),
					image2: require("@/assets/images/cesium/WallImage2.png"),
				});
				break;
			case "WallType2":
				material = Material.fromType("WallType2", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage3.png"),
					image2: require("@/assets/images/cesium/WallImage2.png"),
				});
				break;
			case "WallType3":
				material = Material.fromType("WallType3", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage1.png"),
					count: 2,
				});
				break;
			case "WallType4":
				material = Material.fromType("WallType4", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage1.png"),
					count: 2,
				});
				break;
			case "WallType5":
				material = Material.fromType("WallType5", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage5.png"),
				});
				break;
			case "WallType6":
				material = Material.fromType("WallType6", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage4.png"),
				});
				break;
			case "WallGradient":
				material = Material.fromType("WallGradient", {
					color: wallColor,
					image: require("@/assets/images/cesium/WallImage5.png"),
				});
				break;
			case "WallLineFlow1":
				material = Material.fromType("WallLineFlowY", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage6.png"),
					repeatX: 5,
					repeatY: 1,
				});
				break;
			case "WallLineFlow2":
				material = Material.fromType("WallLineFlowX", {
					color: wallColor,
					speed: 20,
					image: require("@/assets/images/cesium/WallImage7.png"),
					repeatX: 3,
					repeatY: 3,
				});
				break;
		}
		return material;
	};
	let walls = new PrimitiveCollection();
	let texts = new BillboardCollection();
	let wallPrimitive = viewer.scene.primitives.add(walls);
	let textPrimitive = viewer.scene.primitives.add(texts);
	textPrimitive.Key = "PrimitiveWalls"; //唯一标识
	let turfPoints = []; //turf计算范围
	option.data.forEach((item) => {
		let list = item.list;
		turfPoints = turfPoints.concat(list);
		let baseHeight = defaultValue(item.baseHeight, 0);
		let wallHeight = defaultValue(item.wallHeight, 120);
		let offsetHeight = defaultValue(item.offsetHeight, 0);
		let wallColor = defined(item.wallColor) ? Color.fromCssColorString(item.wallColor) : Color.AQUA;
		const { lonLatCenter, cartesianCenter } = CenterPolygon(list, baseHeight, wallHeight, offsetHeight);
		let wallOptions = DegreesToCartesians(list, baseHeight, wallHeight);
		// 根据材质列表 渲染墙
		if (Array.isArray(item.MaterialTypes) && item.MaterialTypes.length > 0) {
			item.MaterialTypes.some((temp) => {
				let material = WallMaterialTypeObject(temp, wallColor);
				walls.add(
					new Primitive({
						geometryInstances: new GeometryInstance({
							geometry: new WallGeometry({
								positions: wallOptions.positions,
								maximumHeights: wallOptions.maximumHeights,
								minimumHeights: wallOptions.minimumHeights,
							}),
						}),
						appearance: new MaterialAppearance({
							material: material,
							faceForward: true, //避免出现黑点
						}),
					}),
				);
			});
		} else {
			walls.add(
				new Primitive({
					geometryInstances: new GeometryInstance({
						geometry: new WallGeometry({
							positions: wallOptions.positions,
							maximumHeights: wallOptions.maximumHeights,
							minimumHeights: wallOptions.minimumHeights,
						}),
					}),
					appearance: new MaterialAppearance({
						material: WallMaterialTypeObject["WallType1"],
						faceForward: true, //避免出现黑点
					}),
				}),
			);
		}

		// 如果显示标签
		if (defined(item.TextOptions)) {
			if (defined(item.TextOptions.image)) {
				if (defined(item.TextOptions.text2)) {
					drawDoubleTextCanvas(item.TextOptions.image, item.TextOptions).then((res) => {
						let temp = texts.add({
							position: cartesianCenter,
							disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
							image: res.canvas,
							scale: defaultValue(item.TextOptions.scale, 1),
							verticalOrigin: VerticalOrigin.BOTTOM,
							horizontalOrigin: HorizontalOrigin.CENTER,
							pixelOffset: defined(item.TextOptions.offset)
								? new Cartesian2(item.TextOptions.offset[0], item.TextOptions.offset[1])
								: new Cartesian2(0, 0),
							distanceDisplayCondition: defined(item.TextOptions.displayByDistance)
								? new DistanceDisplayCondition(item.TextOptions.displayByDistance[0], item.TextOptions.displayByDistance[1])
								: new DistanceDisplayCondition(0, 100000000),
							scaleByDistance: defined(item.TextOptions.scaleByDistance)
								? new NearFarScalar(
										item.TextOptions.scaleByDistance[0],
										item.TextOptions.scaleByDistance[1],
										item.TextOptions.scaleByDistance[2],
										item.TextOptions.scaleByDistance[3],
								  )
								: new NearFarScalar(0, 1, 1, 1),
						});
						temp.attributes = item.attributes;
					});
				} else {
					drawSingleTextCanvas(item.TextOptions.image, item.TextOptions).then((res) => {
						let temp = texts.add({
							position: cartesianCenter,
							disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
							image: res.canvas,
							scale: defaultValue(item.TextOptions.scale, 1),
							verticalOrigin: VerticalOrigin.BOTTOM,
							horizontalOrigin: HorizontalOrigin.CENTER,
							pixelOffset: defined(item.TextOptions.offset)
								? new Cartesian2(item.TextOptions.offset[0], item.TextOptions.offset[1])
								: new Cartesian2(0, 0),
							distanceDisplayCondition: defined(item.TextOptions.displayByDistance)
								? new DistanceDisplayCondition(item.TextOptions.displayByDistance[0], item.TextOptions.displayByDistance[1])
								: new DistanceDisplayCondition(0, 100000000),
							scaleByDistance: defined(item.TextOptions.scaleByDistance)
								? new NearFarScalar(
										item.TextOptions.scaleByDistance[0],
										item.TextOptions.scaleByDistance[1],
										item.TextOptions.scaleByDistance[2],
										item.TextOptions.scaleByDistance[3],
								  )
								: new NearFarScalar(0, 1, 1, 1),
						});
						temp.attributes = item.attributes;
					});
				}
			} else {
				drawTextCanvas(item.TextOptions).then((canvas) => {
					let temp = texts.add({
						position: cartesianCenter,
						disableDepthTestDistance: Number.POSITIVE_INFINITY, //关闭深度检测
						image: canvas,
						scale: defaultValue(item.TextOptions.scale, 1),
						verticalOrigin: VerticalOrigin.BOTTOM,
						horizontalOrigin: HorizontalOrigin.CENTER,
						pixelOffset: defined(item.TextOptions.offset)
							? new Cartesian2(item.TextOptions.offset[0], item.TextOptions.offset[1])
							: new Cartesian2(0, 0),
						distanceDisplayCondition: defined(item.TextOptions.displayByDistance)
							? new DistanceDisplayCondition(item.TextOptions.displayByDistance[0], item.TextOptions.displayByDistance[1])
							: new DistanceDisplayCondition(0, 100000000),
						scaleByDistance: defined(item.TextOptions.scaleByDistance)
							? new NearFarScalar(
									item.TextOptions.scaleByDistance[0],
									item.TextOptions.scaleByDistance[1],
									item.TextOptions.scaleByDistance[2],
									item.TextOptions.scaleByDistance[3],
							  )
							: new NearFarScalar(0, 1, 1, 1),
					});
					temp.attributes = item.attributes;
				});
			}
		}

		// 如果显示3D标签
		if (defined(item.TextOptions3D)) {
			// 添加标签
			let width = 0;
			let offset = defaultValue(item.TextOptions3D.offset, 0);
			let angle = defaultValue(item.TextOptions3D.angle, 0);
			if (defined(item.TextOptions3D.width)) {
				width = meterToDegree(item.TextOptions3D.width);
			} else {
				let bbox = turfBBox(turfLineString(item.list));
				width = Math.pow(Math.pow(bbox[0] - bbox[2], 2) + Math.pow(bbox[1] - bbox[3], 2), 0.5) / Math.pow(2, 0.5);
			}
			if (defined(item.TextOptions3D.image)) {
				drawDoubleTextCanvas(item.TextOptions3D.image, item.TextOptions3D).then((res) => {
					let labelOptions;
					if (defined(item.TextOptions3D.list)) {
						labelOptions = CalculateLabelList(item.TextOptions3D.list, lonLatCenter, width, scale, angle);
					} else {
						labelOptions = CalculateLabel(lonLatCenter, width, res.scale, offset, angle);
					}
					canvasToImage(res.canvas).then((image) => {
						let wall = new Primitive({
							geometryInstances: new GeometryInstance({
								geometry: new WallGeometry({
									positions: labelOptions.positions,
									maximumHeights: labelOptions.maximumHeights,
									minimumHeights: labelOptions.minimumHeights,
								}),
							}),
							appearance: new MaterialAppearance({
								material: Material.fromType("Image", {
									image: image,
								}),
								faceForward: true, //避免出现黑点
							}),
							asynchronous: false,
						});
						walls.add(wall);
					});

					if (defined(item.TextOptions3D.sign)) {
						let signLength = defaultValue(item.TextOptions3D.sign.length, degreeToMeter(width) * res.scale * 0.5);
						let signRadius = defaultValue(item.TextOptions3D.sign.radius, signLength * 0.5);
						let signOffset = defaultValue(item.TextOptions3D.sign.offset, 0);
						let jumpLimit = defaultValue(item.TextOptions3D.sign.jumpLimit, 100);
						walls.add(
							createSign({
								center: lonLatCenter,
								length: signLength,
								radius: signRadius,
								offset: signOffset,
								jumpLimit: jumpLimit,
							}),
						);
					}
				});
			}
		}

		// 分段展示
		if (index > 0 && index % subNum == 0) {
			option.saveData.push({
				wall: wallPrimitive,
				text: textPrimitive,
			});
			walls = new PrimitiveCollection();
			texts = new BillboardCollection();
			wallPrimitive = viewer.scene.primitives.add(walls);
			textPrimitive = viewer.scene.primitives.add(texts);
		}
	});
	option.saveData.push({
		wall: wallPrimitive,
		text: textPrimitive,
	});
	// 返回bbox便于定位
	let bbox = turfBBox(turfLineString(turfPoints));
	return bbox;
}
/**
 * @Author: dongnan
 * @Description: 删除墙
 * @Date: 2021-07-31 11:50:46
 * @param {*} viewer
 * @param {*} saveData
 */
export function removePrimitiveWalls(viewer, saveData) {
	saveData.some((item) => {
		viewer.scene.primitives.remove(item.wall);
		viewer.scene.primitives.remove(item.text);
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 添加材质
 * @Date: 2021-11-10 10:40:00
 * @param {*}
 */
function addMaterial() {
	let source1 = `
		uniform sampler2D image;
		uniform sampler2D image2;
		uniform vec4 color;
		uniform float speed;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			vec2 st = materialInput.st;
			vec4 colorImage = texture2D(image, vec2(0.8-st.t, st.s));
			vec4 colorImage2 = texture2D(image2, vec2(st.s, fract(st.t*1.0- time)));
			material.alpha = colorImage.a * color.a + 0.5*colorImage2.r;
			material.diffuse = color.rgb;
			material.emission = vec3(0.3);
			return material;
		}`;
	Material._materialCache.addMaterial("WallType1", {
		fabric: {
			type: "WallType1",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage1.png"),
				image2: require("@/assets/images/cesium/WallImage2.png"),
				speed: 20,
			},
			source: source1,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source2 = `
		uniform sampler2D image;
		uniform sampler2D image2;
		uniform vec4 color;
		uniform float speed;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			vec2 st = materialInput.st;
			vec4 colorImage = texture2D(image, vec2(st.s, st.t));
			vec4 colorImage2 = texture2D(image2, vec2(st.t, fract(st.s*1.0- time)));
			material.alpha = colorImage.a  + colorImage2.r;
			material.diffuse = color.rgb;
			material.emission = vec3(0.3);
			return material;
		}`;
	Material._materialCache.addMaterial("WallType2", {
		fabric: {
			type: "WallType2",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage3.png"),
				image2: require("@/assets/images/cesium/WallImage2.png"),
				speed: 20,
			},
			source: source2,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source3 = `
		uniform sampler2D image;
		uniform float count;
		uniform vec4 color;
		uniform float speed;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			vec2 st = materialInput.st;
			vec4 colorImage = texture2D(image, vec2(fract(count*st.t +time), st.s));
			material.alpha = colorImage.a;
			material.diffuse = color.rgb;
			material.emission = vec3(0.3);
			return material;
		}`;
	Material._materialCache.addMaterial("WallType3", {
		fabric: {
			type: "WallType3",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage1.png"),
				count: 2,
				speed: 20,
			},
			source: source3,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source4 = `
		uniform sampler2D image;
		uniform float speed;
		uniform vec4 color;
		uniform float count;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			material.diffuse = 1.5 * color.rgb;
			vec2 st = materialInput.st;
			vec3 str = materialInput.str;
			float dis = distance(vec2(st.t, 0), vec2(0.0, 0.0));
			float per = fract(time);
			if (abs(str.z) > 0.001) {
				discard;
			}
			float perDis = 1.0 / count;
			float disNum;
			float bl = 0.0;
			for(int i = 0; i <= 999; i++ ) {
				if(float(i) <= count) {
					disNum = perDis * float(i) - dis + per / count;
					if(disNum > 0.0) {
						if(disNum < perDis) {
							bl = 1.0 - disNum / perDis;
						}else if (disNum - perDis < perDis) {
							bl = 1.0 - abs(1.0 - disNum / perDis);
						}
					}    
					material.alpha = pow(bl, 1.0);
				}
			}
			return material;
		}`;
	Material._materialCache.addMaterial("WallType4", {
		fabric: {
			type: "WallType4",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage1.png"),
				count: 2,
				speed: 20,
			},
			source: source4,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source5 = `
		uniform sampler2D image;
		uniform vec4 color;
		uniform float speed;
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(st.s, st.t));
			material.alpha = smoothstep(0.,1.,colorImage.a-0.4+time*0.4);
            // material.alpha = colorImage.a * (time+0.2);
            material.diffuse = color.rgb;
			material.emission = vec3(0.3);
            return material;
        }`;
	Material._materialCache.addMaterial("WallType5", {
		fabric: {
			type: "WallType5",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage5.png"),
				speed: 20,
			},
			source: source5,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source6 = `
		uniform sampler2D image;
		uniform vec4 color;
		uniform float speed;
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(fract(st.t - time), st.t));
            material.alpha = colorImage.a;
            material.diffuse = color.rgb;
            return material;
        }`;
	Material._materialCache.addMaterial("WallType6", {
		fabric: {
			type: "WallType6",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage4.png"),
				speed: 20,
			},
			source: source6,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source7 = `
		uniform sampler2D image;
		uniform vec4 color;
        czm_material czm_getMaterial(czm_materialInput materialInput){
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec2 st = materialInput.st;
            vec4 colorImage = texture2D(image, vec2(st.s, st.t));
            material.alpha = colorImage.a;
            material.diffuse = color.rgb;
			material.emission = vec3(0.3);
            return material;
        }`;
	Material._materialCache.addMaterial("WallGradient", {
		fabric: {
			type: "WallGradient",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage5.png"),
			},
			source: source7,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source8 = `
		uniform float speed;
		uniform sampler2D image;
		uniform float repeatX;
		uniform float repeatY;
		czm_material czm_getMaterial(czm_materialInput materialInput)
		{
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			czm_material material = czm_getDefaultMaterial(materialInput);
			vec2 st = materialInput.st;
			st.s = st.s*repeatX;
			st.t = st.t*repeatY;
			vec4 colorImage = texture2D(image,   vec2(fract(st.s),fract(st.t - time)));
			material.alpha = colorImage.a * color.a  ;
			material.diffuse =    color.rgb  ;
			return material;
		}`;
	Material._materialCache.addMaterial("WallLineFlowY", {
		fabric: {
			type: "WallLineFlowY",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage6.png"),
				speed: 20,
				repeatX: 1,
				repeatY: 1,
			},
			source: source8,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
	let source9 = `
		uniform float speed;
		uniform sampler2D image;
		uniform float repeatX;
		uniform float repeatY;
		czm_material czm_getMaterial(czm_materialInput materialInput)
		{
			float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			czm_material material = czm_getDefaultMaterial(materialInput);
			vec2 st = materialInput.st;
			st.s = st.s*repeatX;
			st.t = st.t*repeatY;
			vec4 colorImage = texture2D(image,vec2(fract(st.s - time),fract(st.t)));
			material.alpha = colorImage.a * color.a  ;
			material.diffuse =    color.rgb  ;
			return material;
		}`;
	Material._materialCache.addMaterial("WallLineFlowX", {
		fabric: {
			type: "WallLineFlowX",
			uniforms: {
				color: new Color(0.5, 0.5, 0.5, 1.0),
				image: require("@/assets/images/cesium/WallImage6.png"),
				speed: 20,
				repeatX: 1,
				repeatY: 1,
			},
			source: source9,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 根据中心点旋转3D标签
 * @Date: 2022-09-18 21:28:26
 * @param {Array} list 点集合
 * @param {Number} angle 旋转角度
 */
function rotate3DLabel(list, angle) {
	let line = turfLineString(list);
	let rotatedPoly = transformRotate(line, angle);
	let points = rotatedPoly.geometry.coordinates;
	return points;
}
/**
 * @Author: dongnan
 * @Description: 面中心世界坐标
 * @Date: 2021-08-24 14:26:00
 * @param {*} list
 * @param {*} baseHeight
 * @param {*} wallHeight
 * @param {*} offsetHeight
 */
function CenterPolygon(list, baseHeight, wallHeight, offsetHeight) {
	list = list.concat([list[0]]);
	let polygon = turfPolygon([list]);
	let centroid = pointOnFeature(polygon);
	let centerHeight = baseHeight + wallHeight + offsetHeight;
	const lonLatCenter = {
		x: centroid.geometry.coordinates[0],
		y: centroid.geometry.coordinates[1],
		z: centerHeight,
	};
	const cartesianCenter = new Cartesian3.fromDegrees(
		parseFloat(centroid.geometry.coordinates[0]),
		parseFloat(centroid.geometry.coordinates[1]),
		centerHeight,
	);
	return { lonLatCenter, cartesianCenter };
}
/**
 * @Author: dongnan
 * @Description: 经纬度坐标转世界坐标
 * @Date: 2021-08-24 14:24:44
 * @param {*} list
 * @param {*} baseHeight
 * @param {*} wallHeight
 */
function DegreesToCartesians(list, baseHeight, wallHeight) {
	let result1 = [];
	let result2 = [];
	let result3 = [];
	list = list.concat([list[0]]);
	list.forEach((item) => {
		let height = baseHeight + wallHeight;
		result1.push(new Cartesian3.fromDegrees(parseFloat(item[0]), parseFloat(item[1])));
		result2.push(baseHeight);
		result3.push(height);
	});
	let obj = {
		positions: result1,
		minimumHeights: result2,
		maximumHeights: result3,
	};
	return obj;
}
/**
 * @Author: dongnan
 * @Description: 经纬度坐标转世界坐标
 * @Date: 2021-08-24 14:24:44
 * @param {*} list
 * @param {*} center
 * @param {*} width
 * @param {*} scale
 * @param {Number} rotateAngle 旋转角度
 */
function CalculateLabelList(list, center, width, scale, rotateAngle) {
	let baseHeight = center.z;
	let wallHeight = degreeToMeter(width) * scale;
	let height = baseHeight + wallHeight;
	let result1 = [];
	let result2 = [];
	let result3 = [];
	let points = rotate3DLabel(list, rotateAngle);
	points.forEach((item) => {
		result1.push(new Cartesian3.fromDegrees(parseFloat(item[0]), parseFloat(item[1])));
		result2.push(baseHeight);
		result3.push(height);
	});
	let obj = {
		positions: result1,
		minimumHeights: result2,
		maximumHeights: result3,
	};
	return obj;
}
/**
 * @Author: dongnan
 * @Description: 计算3d标签的参数
 * @Date: 2022-08-01 10:26:20
 * @param {*} center
 * @param {*} width
 * @param {*} scale
 * @param {*} offset 偏移
 * @param {Number} rotateAngle 旋转角度
 */
function CalculateLabel(center, width, scale, offset, rotateAngle) {
	let baseHeight = center.z + offset;
	let height = baseHeight + degreeToMeter(width) * scale;
	let result1 = [];
	let result2 = [];
	let result3 = [];
	let list = [
		[center.x - width / 2, center.y],
		[center.x + width / 2, center.y],
	];
	let points = rotate3DLabel(list, rotateAngle);
	points.forEach((item) => {
		result1.push(new Cartesian3.fromDegrees(parseFloat(item[0]), parseFloat(item[1])));
		result2.push(baseHeight);
		result3.push(height);
	});
	let obj = {
		positions: result1,
		minimumHeights: result2,
		maximumHeights: result3,
	};
	return obj;
}
/**
 * @Author: dongnan
 * @Description: 设置模型位置及状态
 * @Date: 2022-02-11 14:08:14
 * @param {Object} params
 * @param {Float} tx 模型中心X轴坐标（经度 单位：度）
 * @param {Float} ty 模型中心Y轴坐标（纬度 单位：度）
 * @param {Float} tz 模型中心Z轴坐标（高程 单位：米）
 * @param {Float} rx X轴（经度）方向旋转角度（单位：度） roll
 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度） pitch
 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度） heading
 * @param {Float} sx X轴缩放比例
 * @param {Float} sy Y轴缩放比例
 * @param {Float} sz Z轴缩放比例
 * @param {String} type 参数类型 cartesian  degrees(默认)
 */
function setMatrix(params) {
	if (!defined(params) && !defined(params.tx) && !defined(params.ty)) return;
	let m = new Matrix4();
	// 初始位置
	if (params.type == "cartesian") {
		let position = new Cartesian3(params.tx, params.ty, defaultValue(params.tz, 0));
		m = Transforms.eastNorthUpToFixedFrame(position);
	} else {
		let position = Cartesian3.fromDegrees(params.tx, params.ty, defaultValue(params.tz, 0));
		m = Transforms.eastNorthUpToFixedFrame(position);
	}
	//旋转
	if (defined(params.rx) || defined(params.ry) || defined(params.rz)) {
		let rotationX = Matrix3.fromRotationX(CesiumMath.toRadians(defaultValue(params.rx, 0)));
		let rotationY = Matrix3.fromRotationY(CesiumMath.toRadians(defaultValue(params.ry, 0)));
		let rotationZ = Matrix3.fromRotationZ(CesiumMath.toRadians(defaultValue(params.rz, 0)));
		Matrix4.multiplyByMatrix3(m, rotationX, m);
		Matrix4.multiplyByMatrix3(m, rotationY, m);
		Matrix4.multiplyByMatrix3(m, rotationZ, m);
	}
	// 缩放
	if (defined(params.sx) || defined(params.sy) || defined(params.sz)) {
		Matrix4.multiplyByScale(m, new Cartesian3(defaultValue(params.sx, 1), defaultValue(params.sy, 1), defaultValue(params.sz, 1)), m);
	}
	// 返回矩阵
	return m;
}
/**
 * @Author: dongnan
 * @Description: 画两个样式的文本canvas
 * @Date: 2021-02-08 23:15:33
 */
function drawDoubleTextCanvas(url, textOptions) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let text1 = "";
			let text2 = "";
			let padding1 = [20, 20, 20, 20];
			let padding2 = [20, 20, 20, 20];
			let font1 = "25px sans-serif";
			let font2 = "40px sans-serif";
			let fillStyle1 = "White";
			let fillStyle2 = "red";
			let strokeStyle1 = "#3e59a9";
			let strokeStyle2 = "#3e59a9";
			let fontSize1 = 25;
			let fontSize2 = 40;
			let textWidth = 0;
			let canvasWidth = 0;
			let canvasHeight = 0;
			if (defined(textOptions)) {
				text1 = defaultValue(textOptions.text, text1);
				text2 = defaultValue(textOptions.text2, text2);
				padding1 = defaultValue(textOptions.padding, padding1);
				padding2 = defaultValue(textOptions.padding2, padding2);
				// 第一个文字样式
				if (defined(textOptions.fontOptions)) {
					font1 = defaultValue(textOptions.fontOptions.font, font1);
					fillStyle1 = defaultValue(textOptions.fontOptions.fillColor, fillStyle1);
					strokeStyle1 = defaultValue(textOptions.fontOptions.strokeColor, strokeStyle1);
				}
				// 第二个文字样式
				if (defined(textOptions.fontOptions2)) {
					font2 = defaultValue(textOptions.fontOptions2.font, font2);
					fillStyle2 = defaultValue(textOptions.fontOptions2.fillColor, fillStyle2);
					strokeStyle2 = defaultValue(textOptions.fontOptions2.strokeColor, strokeStyle2);
				}
			}
			// 确认字的大小
			let fontArray1 = font1.split(" ");
			let fontArray2 = font2.split(" ");
			fontArray1.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize1 = parseFloat(item);
					return;
				}
			});
			fontArray2.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize2 = parseFloat(item);
					return;
				}
			});
			// 根据字的个数判断
			textWidth = fontSize1 * text1.trim().length + fontSize2 * text2.trim().length;
			// 设置padding[上,右,下,左]
			canvasWidth = padding1[1] + padding1[3] + textWidth + padding2[1] + padding2[3];
			canvasHeight =
				padding1[0] + fontSize1 + padding1[2] > padding2[0] + fontSize2 + padding2[2]
					? padding1[0] + fontSize1 + padding1[2]
					: padding2[0] + fontSize2 + padding2[2];
			const canvasScale = canvasHeight / canvasWidth;
			// 设置canvas大小
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			// 绘制图片 100%填充
			let imgWidthScale = canvasWidth / img.width;
			let imgHeightScale = canvasHeight / img.height;
			context.scale(imgWidthScale, imgHeightScale);
			context.drawImage(img, 0, 0);
			context.scale(1 / imgWidthScale, 1 / imgHeightScale);
			document.fonts.load(font1);
			document.fonts.load(font2);
			document.fonts.ready.then(() => {
				// 绘制文字1
				context.lineWidth = 4;
				context.font = font1;
				context.strokeStyle = strokeStyle1;
				context.fillStyle = fillStyle1;
				context.strokeText(text1.trim(), padding1[3], padding1[0] + fontSize1 / 1.5);
				context.fillText(text1.trim(), padding1[3], padding1[0] + fontSize1 / 1.5);
				// 绘制文字2
				let textLength1 = text1.trim().length * fontSize1 + padding1[3] + padding1[1];
				context.lineWidth = 4;
				context.font = font2;
				context.strokeStyle = strokeStyle2;
				context.fillStyle = fillStyle2;
				context.strokeText(text2.trim(), textLength1 + padding2[3], padding2[0] + fontSize2 / 1.5);
				context.fillText(text2.trim(), textLength1 + padding2[3], padding2[0] + fontSize2 / 1.5);
				resolve({
					canvas: canvas,
					scale: canvasScale,
				});
			});
		};
	});
}
/**
 * @Author: dongnan
 * @Description: 画单样式文本canvas 内嵌型
 * @Date: 2021-02-08 23:15:33
 */
function drawSingleTextCanvas(url, textOptions) {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = url;
		img.onload = function () {
			let canvas = document.createElement("canvas");
			let context = canvas.getContext("2d");
			let text = "";
			let padding = [20, 20, 20, 20];
			let font = "30px sans-serif";
			let fillStyle = "White";
			let strokeStyle = "#3e59a9";
			let fontSize = 30;
			let textWidth = 0;
			let textHeight = 0;
			let canvasWidth = 0;
			let canvasHeight = 0;
			if (defined(textOptions)) {
				text = defaultValue(textOptions.text, text);
				padding = defaultValue(textOptions.padding, padding);
				if (defined(textOptions.fontOptions)) {
					font = defaultValue(textOptions.fontOptions.font, font);
					fillStyle = defaultValue(textOptions.fontOptions.fillColor, fillStyle);
					strokeStyle = defaultValue(textOptions.fontOptions.strokeColor, strokeStyle);
				}
			}
			// 确认字的大小
			let fontArray = font.split(" ");
			fontArray.forEach((item) => {
				if (item.indexOf("px") >= 0) {
					fontSize = parseFloat(item);
					return;
				}
			});
			// 根据字的个数判断
			textWidth = fontSize * text.trim().length;
			textHeight = fontSize;
			// 设置padding[上,右,下,左]
			canvasWidth = padding[1] + padding[3] + textWidth;
			canvasHeight = padding[0] + padding[2] + textHeight;
			const canvasScale = canvasHeight / canvasWidth;
			// 设置canvas大小
			canvas.width = canvasWidth;
			canvas.height = canvasHeight;
			// 绘制图片 100%填充
			let imgWidthScale = canvasWidth / img.width;
			let imgHeightScale = canvasHeight / img.height;
			context.scale(imgWidthScale, imgHeightScale);
			context.drawImage(img, 0, 0);
			// 绘制文字
			context.scale(1 / imgWidthScale, 1 / imgHeightScale);
			context.lineWidth = 4;
			document.fonts.load(font);
			document.fonts.ready.then(() => {
				context.font = font;
				context.strokeStyle = strokeStyle;
				context.fillStyle = fillStyle;
				context.strokeText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
				context.fillText(text.trim(), padding[3], padding[0] + fontSize / 1.5);
				resolve({
					canvas: canvas,
					scale: canvasScale,
				});
			});
		};
	});
}
/**
 * @Author: dongnan
 * @Description: 绘制文本canvas
 * @Date: 2021-09-11 20:44:54
 */
function drawTextCanvas(textOptions) {
	return new Promise((resolve, reject) => {
		let canvas = document.createElement("canvas");
		let context = canvas.getContext("2d");
		let font = "28px sans-serif";
		let fillStyle = "#4fa9cb";
		let strokeStyle = "#4fa9cb";
		let fontSize = 28;
		let text = "";
		if (defined(textOptions)) {
			text = defaultValue(textOptions.text.trim(), text);
			if (defined(textOptions.fontOptions)) {
				font = defaultValue(textOptions.fontOptions.font, font);
				fillStyle = defaultValue(textOptions.fontOptions.fillColor, fillStyle);
				strokeStyle = defaultValue(textOptions.fontOptions.strokeColor, strokeStyle);
			}
		}
		// 确认字的大小
		let fontArray = font.split(" ");
		fontArray.some((item) => {
			if (item.indexOf("px") >= 0) {
				fontSize = parseFloat(item);
				return true;
			}
		});
		canvas.width = fontSize * (text.length + 2);
		canvas.height = fontSize + 10;
		context.lineWidth = 2;
		document.fonts.load(font);
		document.fonts.ready.then(() => {
			context.font = font;
			context.fillStyle = fillStyle;
			context.strokeStyle = strokeStyle;
			context.textAlign = "center";
			context.fillText(text, canvas.width / 2, fontSize);
			context.strokeText(text, canvas.width / 2, fontSize);
			resolve(canvas);
		});
	});
}
/**
 * @Author: dongnan
 * @Description: canvas 转 img
 * @Date: 2022-08-01 09:37:57
 * @param {*} canvas
 */
function canvasToImage(canvas) {
	return new Promise((resolve, reject) => {
		//新Image对象，可以理解为DOM
		let image = new Image();
		// canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
		// 指定格式 PNG
		image.src = canvas.toDataURL("image/png");
		image.onload = function () {
			resolve(image);
		};
	});
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
/**
 * @Author: dongnan
 * @Description: 米转经纬度(EPSG:4326)
 * @Date: 2022-08-01 11:14:54
 * @param {*} meter
 */
function meterToDegree(meter) {
	let degree = (meter / (2 * Math.PI * 6371004)) * 360;
	return degree;
}
/**
 * @Author: dongnan
 * @Description: 创建渐变圆锥
 * @Date: 2022-08-01 11:30:36
 * @param {Object} options
 * @param {Object} options.center 中心点
 * @param {Number} options.length 长度
 * @param {Number} options.radius 上半径
 * @param {Number} options.offset 偏移
 * @param {Number} options.jumpLimit 跳动限制高度
 * @param {Cesium.Color} options.color 颜色
 */
function createSign(options) {
	let center = options?.center;
	let length = options?.length;
	let radius = options?.radius;
	let offset = options?.offset;
	let color = options?.color ?? Color.fromCssColorString("#00FFFF");
	let jumpLimit = options?.jumpLimit;
	jumpLimit = jumpLimit + 0.001;
	// 添加棱锥
	let cylinder = new CylinderGeometry({
		length: length,
		topRadius: radius,
		bottomRadius: 0,
	});
	let instance = new GeometryInstance({
		geometry: cylinder,
		modelMatrix: setMatrix({
			tx: center.x,
			ty: center.y,
			tz: center.z + offset + length / 2,
		}),
		attributes: {
			color: ColorGeometryInstanceAttribute.fromColor(color), // 快捷计算顶点颜色
		},
	});
	let vs = `
			attribute vec3 position3DHigh;
			attribute vec3 position3DLow;
			attribute vec3 normal;
			attribute vec2 st;
			attribute float batchId;
			attribute vec4 color;
			varying vec3 v_positionEC;
			varying vec3 v_normalEC;
			varying vec2 v_st;
			varying vec4 v_color;

			varying vec4 v_test;

			void main()
			{
				vec4 p = czm_computePosition();

				v_positionEC = (czm_modelViewRelativeToEye * p).xyz;      // position in eye coordinates
				v_normalEC = czm_normal * normal;                         // normal in eye coordinates
				v_st = st;
				v_color = color;
				float jumpLimit = ${jumpLimit};
				float ty = abs(cos(czm_frameNumber * 0.03)) * jumpLimit;
				vec4 e_position = czm_modelViewRelativeToEye*p;
				vec4 w_position = czm_inverseView * e_position;
				mat4 translateY = mat4(1., 0., 0., 0., 0., 1., 0., ty, 0., 0., 1., 0., 0., 0., 0., 1.);
				vec4 eye_position = czm_view * w_position*translateY;
				vec4 position = czm_projection * eye_position;
				
				gl_Position = position;
			}
		`;
	let fs = `
		varying vec4 v_color;
		varying vec3 v_normalEC;
		void main()
		{	
			vec3 z = vec3(0.0,0.0,1.0);
			float x = abs(dot(v_normalEC, z));//点乘结果余弦值绝对值范围[0,1]
			float alpha = pow( 1.0 - x, 2.0 );//透明度随着余弦值非线性变化  比如二次方  三次方 渲染不同的效果
  			gl_FragColor = vec4(v_color.rgb, alpha );
		}`;
	let appearance = new Appearance({
		renderState: {
			blending: BlendingState.PRE_MULTIPLIED_ALPHA_BLEND, //混合
			depthTest: { enabled: true }, //深度测试
			depthMask: true,
		},
		fragmentShaderSource: fs,
		vertexShaderSource: vs,
	});

	let primitive = new Primitive({
		geometryInstances: instance,
		appearance: appearance,
		asynchronous: false,
	});
	return primitive;
}
