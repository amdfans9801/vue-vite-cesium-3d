/**
 * @Author: dongnan
 * @Description:渐变材质
 * @param color 颜色
 * @param image 墙贴图
 * @Date: 2021-08-24 14:03:49
 */
import * as Cesium from "cesium";
class GradientMaterialProperty {
	constructor(options) {
		this._definitionChanged = new Cesium.Event();
		this._color = undefined;
		this._colorSubscription = undefined;
		this.color = options.color;
		this.image = options.image;
	}
}
Object.defineProperties(GradientMaterialProperty.prototype, {
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

GradientMaterialProperty.prototype.getType = function (time) {
	return "Gradient";
};
GradientMaterialProperty.prototype.getValue = function (time, result) {
	if (!Cesium.defined(result)) {
		result = {};
	}
	result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color);
	result.image = this.image;
	return result;
};
GradientMaterialProperty.prototype.equals = function (other) {
	return this === other || (other instanceof GradientMaterialProperty && Property.equals(this._color, other._color));
};
// 添加材质
let source = `
    uniform sampler2D image;
    uniform vec4 color;
    czm_material czm_getMaterial(czm_materialInput materialInput){
        czm_material material = czm_getDefaultMaterial(materialInput);
        vec2 st = materialInput.st;
        vec4 colorImage = texture2D(image, vec2(st.s, st.t));
        material.alpha = colorImage.a;
        material.diffuse = color.rgb;
        material.emission = vec3(0.1);
        return material;
    }`;
Cesium.Material._materialCache.addMaterial("Gradient", {
	fabric: {
		type: "WallGradient",
		uniforms: {
			color: new Cesium.Color(0.5, 0.5, 0.5, 1.0),
			image: require("@/assets/images/cesium/WallImage5.png"),
		},
		source: source,
	},
	translucent: function (material) {
		return material.uniforms.color.alpha <= 1.0;
	},
});
// 类赋予Cesium 便于调用
Cesium.GradientMaterialProperty = GradientMaterialProperty;
