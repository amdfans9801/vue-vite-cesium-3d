import {
	Cartesian3,
	defined,
	defaultValue,
	Model,
	ModelAnimationLoop,
	Matrix4,
	Transforms,
	CallbackProperty,
	Color,
	Matrix3,
	Math as CesiumMath,
} from "cesium";
/*
 * @Author: dongnan
 * @Description:无人机移动
 * @Date: 2022-02-22 10:00:19
 * @LastEditTime: 2022-02-22 15:11:50
 */
export default class AirMove {
	constructor(option) {
		this.viewer = option.viewer;
		if (!option.url) return;
		//模型
		this.model = this.viewer.scene.primitives.add(
			Model.fromGltf({
				url: option.url,
				modelMatrix: this.updateMaxtrix({ tx: 0, ty: 0, tz: -100 }),
				minimumPixelSize: 128,
				maximumScale: 5000,
			}),
		);
		// 加载动画
		Promise.resolve(this.model.readyPromise).then(() => {
			this.model.activeAnimations.addAll({
				loop: ModelAnimationLoop.REPEAT,
			});
		});
		// 轨迹数据
		this.trailData = [];
		// 数据存储
		this.saveData = [];
		// 轨迹线
		this.trailLine = null;
	}
	/**
	 * @Author: dongnan
	 * @Description: 更新坐标
	 * @Date: 2022-02-22 14:20:28
	 * @param {*} lonlat
	 */
	update(lonlat) {
		let position = Cartesian3.fromDegrees(parseFloat(lonlat[0]), parseFloat(lonlat[1]), isNaN(lonlat[2]) ? 0 : parseFloat(lonlat[2]));
		this.trailData.push(position);
		if (this.trailData.length >= 2 && this.trailLine == null) {
			this.trailLine = new TrailLineEntity({
				viewer: this.viewer,
				positions: this.trailData,
				saveData: this.saveData,
			});
		} else if (this.trailLine && this.trailData.length >= 200) {
			this.trailLine = null;
			this.trailData = [this.trailData[this.trailData.length - 1]].concat([position]);
			this.trailLine = new TrailLineEntity({
				viewer: this.viewer,
				positions: this.trailData,
				saveData: this.saveData,
			});
		}
		let heading = 0;
		let pitch = 0;
		if (this.trailData.length >= 2) {
			let length = this.trailData.length;
			heading = this.courseHeadingAngle(this.trailData[length - 2], this.trailData[length - 1]);
			pitch = this.coursePitchAngle(this.trailData[length - 2], this.trailData[length - 1]);
		}

		this.model.modelMatrix = this.updateMaxtrix({
			tx: position.x,
			ty: position.y,
			tz: position.z,
			ry: pitch,
			rz: heading,
			type: "cartesian",
		});
	}
	/**
	 * @Author: dongnan
	 * @Description: 清除
	 * @Date: 2022-02-22 17:54:57
	 * @param {*}
	 */
	clear() {
		this.saveData.some((item) => {
			this.viewer.entities.remove(item);
		});
		this.trailLine = null;
		this.trailData = [];
		this.saveData = [];
		this.viewer.scene.primitives.remove(this.model);
	}
	/**
	 * @Author: dongnan
	 * @Description: 更新矩阵
	 * @Date: 2022-02-11 14:08:14
	 * @param {Object} params
	 * @param {Float} tx 模型中心X轴坐标（经度 单位：度）
	 * @param {Float} ty 模型中心Y轴坐标（纬度 单位：度）
	 * @param {Float} tz 模型中心Z轴坐标（高程 单位：米）
	 * @param {Float} rx X轴（经度）方向旋转角度（单位：度） roll
	 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度） pitch
	 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度） heading
	 * @param {Float} scale 缩放比例
	 * @param {String} type 参数类型 cartesian  degrees(默认)
	 */
	updateMaxtrix(params) {
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
		if (defined(params.scale)) {
			let scale = Matrix4.fromUniformScale(params.scale || 1.0);
			Matrix4.multiply(m, scale, m);
		}
		// 返回矩阵
		return m;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算两点之间Z轴旋转角度(heading)
	 * @Date: 2021-05-05 21:59:35
	 * @param {*} p1 A点世界坐标
	 * @param {*} p2 B点世界坐标
	 */
	courseHeadingAngle(p1, p2) {
		let localToWorld_Matrix = Transforms.eastNorthUpToFixedFrame(p1);
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Matrix4.inverse(localToWorld_Matrix, new Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Matrix4.multiplyByPoint(worldToLocal_Matrix, p1, new Cartesian3());
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Matrix4.multiplyByPoint(worldToLocal_Matrix, p2, new Cartesian3());
		//弧度
		let angle = Math.atan2(localPosition_B.y - localPosition_A.y, localPosition_B.x - localPosition_A.x);
		//角度
		let theta = angle * (180 / Math.PI);
		if (theta < 180) {
			theta = theta + 360;
		}
		return theta;
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算两点之间Y轴旋转角度(pitch)
	 * @Date: 2021-05-05 21:59:45
	 * @param {*} p1 A点世界坐标
	 * @param {*} p2 B点世界坐标
	 */
	coursePitchAngle(p1, p2) {
		//以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
		let localToWorld_Matrix = Transforms.eastNorthUpToFixedFrame(p1);
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Matrix4.inverse(localToWorld_Matrix, new Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Matrix4.multiplyByPoint(worldToLocal_Matrix, p1, new Cartesian3());
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Matrix4.multiplyByPoint(worldToLocal_Matrix, p2, new Cartesian3());
		let distance = Math.sqrt(Math.pow(localPosition_B.x - localPosition_A.x, 2) + Math.pow(localPosition_B.y - localPosition_A.y, 2));
		let dz = p2.z - p1.z;
		let angle = 0;
		if (distance != 0) {
			angle = Math.tanh(dz / distance);
		}
		let theta = angle * (180 / Math.PI);
		return theta;
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
class TrailLineEntity {
	constructor(option) {
		this.viewer = option.viewer;
		this.saveData = option.saveData;
		//实线点位
		this.positions = option.positions;
		//实线实体
		this.polyLine = this.viewer.entities.add({
			name: "实线",
			polyline: {
				show: true,
				positions: new CallbackProperty(() => {
					return this.positions;
				}, false),
				material: Color.RED,
				width: 3,
				clampToGround: false,
			},
		});
		this.saveData.push(this.polyLine);
	}
}
