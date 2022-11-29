import * as Cesium from "cesium";
export default class Cloud {
	constructor(val) {
		this.viewer = val.viewer;
		this.delegate = null; //储存实体
		this.rotateAmount = 0.2;
		this.heading = 0;
	}
	_createPrimitive() {
		let _this = this;
		this.delegate = new Cesium.Primitive({
			appearance: new Cesium.EllipsoidSurfaceAppearance({
				material: new Cesium.Material({
					fabric: {
						type: "Image",
						uniforms: {
							color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
							image: require("@/assets/images/cesium/EarthCloud.png"),
						},
						components: {
							alpha: "texture2D(image, fract(repeat * materialInput.st)).r * color.a",
							diffuse: "vec3(1.0)",
						},
					},
				}),
				translucent: true,
				aboveGround: true,
			}),
		});
		this.delegate.geometryInstances = new Cesium.GeometryInstance({
			geometry: new Cesium.EllipsoidGeometry({
				vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
				radii: _this.viewer.scene.globe.ellipsoid.radii,
			}),
			// geometry: new Cesium.RectangleGeometry({
			// 	rectangle: Cesium.Rectangle.fromDegrees(
			// 		-180.0,
			// 		-90.0,
			// 		180.0,
			// 		90.0,
			// 	),
			// }),
			id: "23213213",
		});
		this.delegate.show = true;
		this.viewer.scene.primitives.add(this.delegate);
		// console.log(new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0.01), 0, 0))
		this.viewer.scene.postRender.addEventListener(this._onRotate, this);
	}
	_onRotate(scene, time) {
		let _this = this;
		if (_this.rotateAmount == 0) {
			return;
		}
		_this.heading += _this.rotateAmount;
		if (_this.heading >= 360 || _this.heading <= -360) {
			_this.heading = 0;
		}
		this.delegate.modelMatrix =
			Cesium.Transforms.headingPitchRollToFixedFrame(
				new Cesium.Cartesian3(),
				new Cesium.HeadingPitchRoll(
					Cesium.Math.toRadians(_this.heading),
					0,
					0,
				),
			);
	}
	_deletePrimitive() {
		this.viewer.scene.postUpdate.removeEventListener(this._onRotate, this);
		this.viewer.scene.primitives.remove(this.delegate);
	}
}
