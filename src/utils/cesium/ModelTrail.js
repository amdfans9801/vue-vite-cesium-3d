import {
	Model,
	ModelAnimationLoop,
	Matrix3,
	Math as CesiumMath,
	Matrix4,
	Cartesian3,
	Transforms,
	defaultValue,
	defined,
	SampledPositionProperty,
	JulianDate,
	Cartographic,
	EllipsoidGeodesic,
	PolylineDashMaterialProperty,
	Color,
	PolylineGlowMaterialProperty,
} from "cesium";
/*
 * @Author: dongnan
 * @Description:模型轨迹
 * @Date: 2022-02-11 13:49:48
 * @LastEditTime: 2022-02-11 14:08:02
 * viewer、url、params、list、time,isCalculatePitch
 */
export default class ModelTrail {
	constructor(option) {
		this.viewer = option.viewer;
		if (!option.url || !option.params) return;
		//模型
		this.model = this.viewer.scene.primitives.add(
			Model.fromGltf({
				url: option.url,
				modelMatrix: this.updateMaxtrix(option.params),
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
		// 运动事件
		this.animateEvent = null;
		// 运动停止时间
		this.stopTime = null;
		// 位置差值
		this.positionInterpolation = new SampledPositionProperty();
		// 旋转差值
		this.rotateInterpolation = new SampledPositionProperty();
		// 运动路径数据 [[tx,ty,tz]]
		this.list = option.list;
		// 总时间
		this.time = defaultValue(option.time, 6);
		// 底线
		this.basePath = null;
		this.modelPath = null;
		// 开始位置
		this.startPosition = null;
		// 停止位置
		this.endPosition = null;
		// 停止旋转参数
		this.endRotation = null;
		// 节点时间
		this.partTimeList = [];
		// 当前旋转参数
		this.currentRotation = new Cartesian3(0, 0, 0);
		// 是否计算俯仰角
		this.isCalculatePitch = option.isCalculatePitch;
	}
	/**
	 * @Author: dongnan
	 * @Description: 开始运动
	 * @Date: 2022-02-11 15:24:19
	 * @param {*}
	 */
	start() {
		// 打开加载动画配置
		this.viewer.clock.shouldAnimate = true;
		let data = this.calculateTime(this.list, this.time);
		let startTime = JulianDate.fromDate(new Date());
		let timeSum = 0;
		this.startPosition = data.positions[0];
		data.positions.some((item, index) => {
			this.positionInterpolation.addSample(JulianDate.addSeconds(startTime, timeSum, new JulianDate()), item);
			this.rotateInterpolation.addSample(JulianDate.addSeconds(startTime, timeSum, new JulianDate()), data.rotations[index]);
			this.partTimeList.push(JulianDate.addSeconds(startTime, timeSum, new JulianDate()));
			if (index < data.positions.length - 1) {
				timeSum += data.timeList[index];
			} else {
				this.endPosition = item;
				this.endRotation = data.rotations[index];
			}
		});
		// 计算运动停止时间
		this.stopTime = JulianDate.addSeconds(startTime, timeSum, new JulianDate());
		this.animateEvent = (scene, time) => {
			if (JulianDate.compare(this.stopTime, time) > 0 && JulianDate.compare(this.stopTime, time) <= 0.1) {
				this.model.modelMatrix = this.updateMaxtrix({
					tx: this.endPosition.x,
					ty: this.endPosition.y,
					tz: this.endPosition.z,
					rx: this.endRotation.x,
					ry: this.endRotation.y,
					rz: this.endRotation.z,
					type: "cartesian",
				});
				this.viewer.scene.preUpdate.removeEventListener(this.animateEvent);
				return;
			} else {
				let position = this.positionInterpolation.getValue(time);

				if (typeof position == "undefined") {
					return;
				}
				this.model.modelMatrix = this.updateMaxtrix({
					tx: position.x,
					ty: position.y,
					tz: position.z,
					rx: this.currentRotation.x,
					ry: this.currentRotation.y,
					rz: this.currentRotation.z,
					type: "cartesian",
				});
				this.partTimeList.some((item) => {
					if (JulianDate.compare(item, time) > 0 && JulianDate.compare(item, time) <= 0.1) {
						let rotation = this.rotateInterpolation.getValue(time);
						this.currentRotation.x = rotation.x;
						this.currentRotation.y = rotation.y;
						this.currentRotation.z = rotation.z;
						return true;
					}
				});
			}
		};
		this.viewer.scene.preUpdate.addEventListener(this.animateEvent);
		this.viewer.clock.currentTime = startTime.clone();
		// 添加底线
		this.basePath = this.viewer.entities.add({
			polyline: {
				positions: data.positions,
				width: 3,
				material: new PolylineDashMaterialProperty({
					color: Color.YELLOWGREEN,
				}),
				clampToGround: false,
			},
		});
		this.modelPath = this.viewer.entities.add({
			position: this.positionInterpolation,
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
	}
	/**
	 * @Author: dongnan
	 * @Description: 移除
	 * @Date: 2022-02-11 16:36:55
	 * @param {*}
	 */
	remove() {
		// 移除事件
		this.viewer.scene.preUpdate.removeEventListener(this.animateEvent);
		// 插值重置
		this.positionInterpolation = new SampledPositionProperty();
		this.rotateInterpolation = new SampledPositionProperty();
		// 移除所加载的要素
		if (this.model) this.viewer.scene.primitives.remove(this.model);
		if (this.modelPath) this.viewer.entities.remove(this.basePath);
		if (this.modelPath) this.viewer.entities.remove(this.modelPath);
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
	 * @Description: 计算匀速情况下 每段路程的时间
	 * @Date: 2021-11-13 19:18:30
	 * @param {*} list [[tx,ty,tz]]
	 * @param {*} time 总时间
	 */
	calculateTime(list, time) {
		let positions = [];
		let rotations = [];
		let lengthList = [];
		let timeList = [];
		let totalLength = 0;
		list.some((item, index) => {
			let position = Cartesian3.fromDegrees(parseFloat(item[0]), parseFloat(item[1]), defaultValue(item[2], 0));
			positions.push(position);
			if (index < list.length - 1) {
				// 计算偏转角
				let heading = this.courseHeadingAngle(
					parseFloat(item[0]),
					parseFloat(item[1]),
					parseFloat(list[index + 1][0]),
					parseFloat(list[index + 1][1]),
				);
				// 计算俯仰角
				let pitch = 0;
				if (this.isCalculatePitch) {
					pitch = this.coursePitchAngle(
						parseFloat(item[0]),
						parseFloat(item[1]),
						isNaN(item[2]) ? 0 : parseFloat(item[2]),
						parseFloat(list[index + 1][0]),
						parseFloat(list[index + 1][1]),
						isNaN(list[index + 1][2]) ? 0 : parseFloat(list[index + 1][2]),
					);
				}
				let rotation = new Cartesian3(0, pitch, heading);
				rotations.push(rotation);
				// 计算路程
				let endPosition = Cartesian3.fromDegrees(
					parseFloat(list[index + 1][0]),
					parseFloat(list[index + 1][1]),
					isNaN(list[index + 1][2]) ? 0 : parseFloat(list[index + 1][2]),
				);
				let length = this.getLineDistance(position, endPosition);
				lengthList.push(length);
				totalLength += length;
			} else {
				rotations = rotations.concat([rotations[index - 1]]);
			}
		});
		lengthList.some((item) => {
			let newTime = (time * item) / totalLength;
			timeList.push(newTime);
		});
		return {
			positions: positions,
			rotations: rotations,
			timeList: timeList,
		};
	}
	/**
	 * @Author: dongnan
	 * @Description: 计算两点之间Z轴旋转角度(heading)
	 * @Date: 2021-05-05 21:59:35
	 * @param {*} lng_a A点经度
	 * @param {*} lat_a A点纬度
	 * @param {*} lng_b B点经度
	 * @param {*} lat_b B点纬度
	 */
	courseHeadingAngle(lng_a, lat_a, lng_b, lat_b) {
		let localToWorld_Matrix = Transforms.eastNorthUpToFixedFrame(new Cartesian3.fromDegrees(lng_a, lat_a));
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Matrix4.inverse(localToWorld_Matrix, new Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cartesian3.fromDegrees(lng_a, lat_a), new Cartesian3());
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cartesian3.fromDegrees(lng_b, lat_b), new Cartesian3());
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
	 * @param {*} lng_a A点经度
	 * @param {*} lat_a A点纬度
	 * @param {*} alt_a A点高度
	 * @param {*} lng_b B点经度
	 * @param {*} lat_b B点纬度
	 * @param {*} alt_b B点高度
	 */
	coursePitchAngle(lng_a, lat_a, alt_a, lng_b, lat_b, alt_b) {
		//以a点为原点建立局部坐标系（东方向为x轴,北方向为y轴,垂直于地面为z轴），得到一个局部坐标到世界坐标转换的变换矩阵
		let localToWorld_Matrix = Transforms.eastNorthUpToFixedFrame(new Cartesian3.fromDegrees(lng_a, lat_a));
		//求世界坐标到局部坐标的变换矩阵
		let worldToLocal_Matrix = Matrix4.inverse(localToWorld_Matrix, new Matrix4());
		//a点在局部坐标的位置，其实就是局部坐标原点
		let localPosition_A = Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cartesian3.fromDegrees(lng_a, lat_a), new Cartesian3());
		//B点在以A点为原点的局部的坐标位置
		let localPosition_B = Matrix4.multiplyByPoint(worldToLocal_Matrix, new Cartesian3.fromDegrees(lng_b, lat_b), new Cartesian3());
		let distance = Math.sqrt(Math.pow(localPosition_B.x - localPosition_A.x, 2) + Math.pow(localPosition_B.y - localPosition_A.y, 2));
		let dz = alt_b - alt_a;
		let angle = 0;
		if (distance != 0) {
			angle = Math.tanh(dz / distance);
		}
		let theta = angle * (180 / Math.PI);
		return theta;
	}
	/**
	 * @Author: dongnan
	 * @Description: 获取俩点的距离，返回公里单位值
	 * @Date: 2021-01-14 11:35:27
	 * @param {*} startPoint
	 * @param {*} endPoint
	 */
	getLineDistance(startPoint, endPoint) {
		let startCartographic = Cartographic.fromCartesian(startPoint);
		let endCartographic = Cartographic.fromCartesian(endPoint);
		let geodesic = new EllipsoidGeodesic();
		geodesic.setEndPoints(startCartographic, endCartographic);
		let surfaceDistance = geodesic.surfaceDistance;
		let lengthInMeters = Math.sqrt(Math.pow(surfaceDistance, 2) + Math.pow(endCartographic.height - startCartographic.height, 2));
		return lengthInMeters;
	}
}
