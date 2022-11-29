import {
	defaultValue,
	Cartesian3,
	CallbackProperty,
	ImageMaterialProperty,
	Material,
	Color,
	GroundPrimitive,
	GeometryInstance,
	EllipseGeometry,
	EllipsoidSurfaceAppearance,
	Math as CesiumMath,
	ClassificationType,
	HeightReference,
} from "cesium";
import { lineString, bbox as turfBBox } from "@turf/turf";
import { zoomToExtent } from "@/utils/cesium/CameraTool";
addMaterials();
/**
 * @Author: dongnan
 * @Description: 添加扫描圈
 * @Date: 2021-08-01 17:00:00
 * @param {*} viewer
 * @param {*} center 中心点
 * @param {*} height 高度
 * @param {*} radius 半径
 * @param {*} speed 速度
 * @param return circleEntity
 */
export function addEntityScan(viewer, option) {
	let s1 = 0.001;
	let s2 = 0.001;
	let sStartFlog = false;
	let stRotation = 0;
	let rotation = (defaultValue(option.speed, 20) * 6) / 1000;
	setTimeout(function () {
		console.log("延迟开放加载标志");
		sStartFlog = true;
	}, 70);
	let circleEntity = viewer.entities.add({
		position: Cartesian3.fromDegrees(
			parseFloat(option.center[0]),
			parseFloat(option.center[1]),
			isNaN(option.height) ? 0 : option.height,
		),
		ellipse: {
			semiMinorAxis: new CallbackProperty(function () {
				if (sStartFlog) {
					s1 = s1 + option.radius / 20;
					if (s1 >= option.radius) {
						s1 = option.radius;
					}
				}
				return s1;
			}, false),
			semiMajorAxis: new CallbackProperty(function () {
				if (sStartFlog) {
					s2 = s2 + option.radius / 20;
					if (s2 >= option.radius) {
						s2 = option.radius;
					}
				}
				return s2;
			}, false),
			stRotation: new CallbackProperty(function () {
				stRotation += rotation;
				return stRotation;
			}, false),
			material: new ImageMaterialProperty({
				image: require("@/assets/images/cesium/circle_line.png"),
				transparent: true,
			}),
			granularity: CesiumMath.RADIANS_PER_DEGREE,
			classificationType: ClassificationType.BOTH,
			heightReference: HeightReference.CLAMP_TO_GROUND,
			outline: false,
		},
	});
	return circleEntity;
}
/**
 * @Author: dongnan
 * @Description: 添加扫描圈
 * @Date: 2021-12-14 14:50:26
 * @param {*} viewer
 * @param {*} center [x,y]
 * @param {*} height 高度
 * @param {*} radius 米
 * @param {*} MaterialOptions {color,speed,count,gradient}
 */
export function addPrimitiveScan(viewer, option) {
	let MaterialOptions = defaultValue(option.MaterialOptions, {
		color: "red",
		speed: 10,
		count: 1,
		gradient: 8,
	});
	let scan = viewer.scene.primitives.add(
		new GroundPrimitive({
			geometryInstances: new GeometryInstance({
				geometry: new EllipseGeometry({
					center: Cartesian3.fromDegrees(
						parseFloat(option.center[0]),
						parseFloat(option.center[1]),
					),
					semiMajorAxis: option.radius,
					semiMinorAxis: option.radius,
					height: defaultValue(option.height, 0),
				}),
			}),
			appearance: new EllipsoidSurfaceAppearance({
				material: Material.fromType("EllipseWave", {
					color: Color.fromCssColorString(
						defaultValue(MaterialOptions.color, "red"),
					),
					speed: defaultValue(MaterialOptions.speed, 10),
					count: defaultValue(MaterialOptions.count, 1),
					gradient: defaultValue(MaterialOptions.gradient, 8),
				}),
			}),
		}),
	);
	fitBound(viewer, option.center, option.radius);
	return scan;
}
/**
 * @Author: dongnan
 * @Description:
 * @Date: 2021-12-15 10:30:21
 * @param {*}
 */
function addMaterials() {
	let source1 = `
	uniform vec4 color;
	uniform float speed;
	uniform float count;
	uniform float gradient;
	czm_material czm_getMaterial(czm_materialInput materialInput){
        czm_material material = czm_getDefaultMaterial(materialInput);
        material.diffuse = 1.5 * color.rgb;
        vec2 st = materialInput.st;
        vec3 str = materialInput.str;
        float dis = distance(st, vec2(0.5, 0.5));
        float time = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
        float per = fract(time);
        if (abs(str.z) > 0.001) {
            discard;
        }
        if (dis > 0.5) { 
            discard; 
        } else { 
            float perDis = 0.5 / count;
            float disNum; 
            float bl = .0; 
            for (int i = 0; i <= 999; i++) { 
                if (float(i) <= count) { 
                    disNum = perDis * float(i) - dis + per / count; 
                    if (disNum > 0.0) { 
                        if (disNum < perDis) { 
                            bl = 1.0 - disNum / perDis;
                        }
                        else if (disNum - perDis < perDis) { 
                            bl = 1.0 - abs(1.0 - disNum / perDis); 
                        }
                        material.alpha = pow(bl, gradient); 
                    }
                }
            }
        } 
        return material; 
    }`;
	Material._materialCache.addMaterial("EllipseWave", {
		fabric: {
			type: "EllipseWave",
			uniforms: {
				color: new Color(1.0, 0.0, 0.0, 1.0),
				speed: 10,
				count: 1,
				gradient: 5,
			},
			source: source1,
		},
		translucent: function (material) {
			return material.uniforms.color.alpha <= 1.0;
		},
	});
}
/**
 * @Author: dongnan
 * @Description: 定位
 * @Date: 2021-12-16 15:21:04
 * @param {*} viewer
 * @param {*} center
 * @param {*} radius
 * @param {*} range
 */
function fitBound(viewer, center, radius, range) {
	let degree = (radius / (2 * Math.PI * 6371004)) * 360;
	let list = [
		[parseFloat(center[0]) + degree, parseFloat(center[1])],
		[parseFloat(center[0]) - degree, parseFloat(center[1])],
		[parseFloat(center[0]), parseFloat(center[1]) + degree],
		[parseFloat(center[0]), parseFloat(center[1]) - degree],
	];
	let bbox = turfBBox(lineString(list));
	zoomToExtent(viewer, {
		extent: bbox,
		radius: defaultValue(range, 4.5),
	});
}
