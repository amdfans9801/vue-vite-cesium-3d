/**
 * @Author: dongnan
 * @Description: 单循环流动线 首尾不连续
 * @param color 线段颜色
 * @param speed 流动速度
 * @Date: 2021-08-08 19:05:42
 */
import * as Cesium from "cesium";
class FlowLineMaterialProperty {
	constructor(options) {
		options = Cesium.defaultValue(options, Cesium.defaultValue.EMPTY_OBJECT);
		this._definitionChanged = new Cesium.Event();
		this._color = void 0;
		this._speed = void 0;
		this._percent = void 0;
		this._gradient = void 0;
		this._colorSubscription = void 0;
		this.color = options.color;
		this.speed = options.speed;
		this.image = options.image;
		this.repeatX = options.repeatX ?? 1;
		this.repeatY = options.repeatY ?? 1;
		this._time = performance.now();
	}
}
Object.defineProperties(FlowLineMaterialProperty.prototype, {
	isConstant: {
		get: function () {
			return false;
		},
	},
	definitionChanged: {
		get: function () {
			return this._definitionChanged;
		},
	},
	color: Cesium.createPropertyDescriptor("color"),
});
FlowLineMaterialProperty.prototype.getType = function (time) {
	return "FlowLine";
};
FlowLineMaterialProperty.prototype.getValue = function (time, result) {
	Cesium.defined(result) || (result = {});
	result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
	result.speed = this.speed;
	result.image = this.image;
	result.repeatX = this.repeatX;
	result.repeatY = this.repeatY;
	return result;
};

FlowLineMaterialProperty.prototype.equals = function (other) {
	return this === other || (other instanceof FlowLineMaterialProperty && Cesium.Property.equals(this._color, other._color));
};
// 添加材质
Cesium.FlowLineSource = `
		uniform sampler2D image;
		uniform vec4 color;
		uniform float speed;
		uniform float repeatX;
		uniform float repeatY;
		czm_material czm_getMaterial(czm_materialInput materialInput){
			czm_material material = czm_getDefaultMaterial(materialInput);
			float t = clamp(fract(czm_frameNumber * speed / 1000.0),0.0,1.0);
			vec2 st = materialInput.st;
			st.s = st.s*repeatX;
			st.t = st.t*repeatY;
			st = fract(st);
			vec4 colorImage = texture2D(image, vec2(fract(st.s - t), st.t));
			material.alpha = colorImage.a * color.a;
			material.diffuse = color.rgb;
			return material;
		}`;
Cesium.Material._materialCache.addMaterial("FlowLine", {
	fabric: {
		type: "FlowLine",
		uniforms: {
			color: new Cesium.Color(1.0, 0.0, 0.0, 0.5),
			image: "images/FlowLine.png",
			speed: 20,
			repeatX: 1,
			repeatY: 1,
		},
		source: Cesium.FlowLineSource,
	},
	translucent: function (material) {
		return material.uniforms.color.alpha <= 1.0;
	},
});
// 类赋予Cesium
Cesium.FlowLineMaterialProperty = FlowLineMaterialProperty;
