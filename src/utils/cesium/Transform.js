import { Matrix3, Math as CesiumMath, Matrix4, Cartesian3, Transforms, defaultValue, defined } from "cesium";
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
export function setMatrix(params) {
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
 * @Description: 矩阵叠加
 * @Date: 2022-02-21 11:16:59
 * @param {Matrix4} matrix 初始矩阵
 * @param {Object} params
 * @param {Float} tx X轴平移距离 单位：米
 * @param {Float} ty Y轴平移距离 单位：米
 * @param {Float} tz Z轴平移距离 单位：米
 * @param {Float} rx X轴（经度）方向旋转角度（单位：度）
 * @param {Float} ry Y轴（经度）方向旋转角度（单位：度）
 * @param {Float} rz Z轴（高程）方向旋转角度（单位：度）
 * @param {Float} sx X轴缩放比例
 * @param {Float} sy Y轴缩放比例
 * @param {Float} sz Z轴缩放比例
 */
export function moveMatrix(matrix, params) {
	if (!defined(params)) return;
	let m = matrix.clone();
	// 平移
	if (defined(params.tx) || defined(params.ty) || defined(params.tz)) {
		let translation = new Cartesian3(defaultValue(params.tx, 0), defaultValue(params.ty, 0), defaultValue(params.tz, 0));
		Matrix4.multiplyByTranslation(m, translation, m);
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
