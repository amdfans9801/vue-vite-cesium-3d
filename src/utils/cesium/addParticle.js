import {
	Cartesian3,
	defaultValue,
	ParticleSystem,
	Color,
	Cartesian2,
	ParticleBurst,
	ConeEmitter,
	CircleEmitter,
	Math as CesiumMath,
	JulianDate,
	HeadingPitchRoll,
	TranslationRotationScale,
	Quaternion,
	Matrix4,
	Transforms,
} from "cesium";
/**
 * @Author: dongnan
 * @Description: 添加火焰粒子
 * @Date: 2021-11-17 10:05:23
 * @param {*} viewer
 * @param {*} position [x,y,z] 经纬度
 * @param {*} saveData 存储地址
 */
export function addParticleFire(viewer, option) {
	let imageSize = [50, 50];
	let entity = viewer.entities.add({
		position: Cartesian3.fromDegrees(
			option.position[0],
			option.position[1],
			defaultValue(option.position[2], 0),
		),
	});
	let primitive = viewer.scene.primitives.add(
		new ParticleSystem({
			image: require("@/assets/images/cesium/fire.png"),
			startColor: Color.RED.withAlpha(0.7), //粒子出生时的颜色
			endColor: Color.YELLOW.withAlpha(0.3), //当粒子死亡时的颜色
			startScale: 1.0, //粒子出生时的比例，相对于原始大小
			endScale: 2.0, //粒子在死亡时的比例
			minimumParticleLife: 1.0, //设置粒子寿命的可能持续时间的最小界限（以秒为单位），粒子的实际寿命将随机生成
			maximumParticleLife: 3.0, //设置粒子寿命的可能持续时间的最大界限（以秒为单位），粒子的实际寿命将随机生成
			minimumSpeed: 1.0, //设置以米/秒为单位的最小界限，超过该最小界限，随机选择粒子的实际速度。
			maximumSpeed: 4.0, //设置以米/秒为单位的最大界限，超过该最大界限，随机选择粒子的实际速度。
			imageSize: new Cartesian2(imageSize[0], imageSize[1]), //如果设置该属性，将会覆盖 minimumImageSize和maximumImageSize属性，以像素为单位缩放image的大小
			emissionRate: 5.0, //每秒发射的粒子数。
			bursts: [
				// time：在粒子系统生命周期开始之后的几秒钟内将发生突发事件。
				// minimum：突发中发射的最小粒子数量
				// maximum：突发中发射的最大粒子数量
				// new ParticleBurst({ time: 5.0, minimum: 10, maximum: 100 }), // 当在5秒时，发射的数量为10-100
				// new ParticleBurst({ time: 10.0, minimum: 50, maximum: 100 }), // 当在10秒时，发射的数量为50-100
				// new ParticleBurst({ time: 15.0, minimum: 200, maximum: 300 }) // 当在15秒时，发射的数量为200-300
			],
			lifetime: 16.0, //多长时间的粒子系统将以秒为单位发射粒子
			emitter: new ConeEmitter(CesiumMath.toRadians(30.0)), //此系统的粒子发射器  共有 圆形、锥体、球体、长方体 ( BoxEmitter,CircleEmitter,ConeEmitter,SphereEmitter ) 几类
			modelMatrix: computeModelMatrix(entity, JulianDate.now()), // 4x4转换矩阵，可将粒子系统从模型转换为世界坐标
			emitterModelMatrix: computeEmitterModelMatrix(), // 4x4转换矩阵，用于在粒子系统本地坐标系中转换粒子系统发射器
		}),
	);
	// 粒子效果贴地
	// viewer.camera.moveStart.addEventListener(function () {
	// 	let pitch = viewer.camera.pitch;
	// 	let verticalView = CesiumMath.toRadians(-90.0);
	// 	// 1.25是个比例参数，我觉得看上去更真实
	// 	primitive._maximumHeight = imageSize[0] * 1.25 * (pitch / verticalView);
	// 	primitive._minimumHeight = imageSize[0] * 1.25 * (pitch / verticalView);
	// });
	// viewer.camera.moveEnd.addEventListener(function () {
	// 	let pitch = viewer.camera.pitch;
	// 	let verticalView = CesiumMath.toRadians(-90.0);
	// 	primitive._maximumHeight = imageSize[0] * 1.25 * (pitch / verticalView);
	// 	primitive._minimumHeight = imageSize[0] * 1.25 * (pitch / verticalView);
	// });
	// 存储
	option.saveData.push({
		entity: entity,
		primitive: primitive,
	});
	/**
	 * @Author: dongnan
	 * @Description: 粒子系统转为世界坐标
	 * @Date: 2021-11-17 10:14:35
	 * @param {*} entity
	 * @param {*} time
	 */
	function computeModelMatrix(entity, time) {
		return entity.computeModelMatrix(time, new Matrix4());
	}
	/**
	 * @Author: dongnan
	 * @Description: 粒子世界坐标转为本地系统发射器
	 * @Date: 2021-11-17 10:14:52
	 * @param {*}
	 */
	function computeEmitterModelMatrix() {
		var hpr = HeadingPitchRoll.fromDegrees(0, 0, 0);
		var trs = new TranslationRotationScale();
		trs.translation = Cartesian3.fromElements(2.5, 4, 1);
		trs.rotation = Quaternion.fromHeadingPitchRoll(hpr);
		var result = Matrix4.fromTranslationRotationScale(trs);
		return result;
	}
}
/**
 * @Author: dongnan
 * @Description: 移除火焰粒子
 * @Date: 2021-11-17 10:16:40
 * @param {*} viewer
 * @param {*} saveData
 */
export function removeParticleFire(viewer, saveData) {
	saveData.some((item) => {
		viewer.entities.remove(item.entity);
		viewer.scene.primitives.remove(item.primitive);
	});
	saveData.splice(0, saveData.length);
}
/**
 * @Author: dongnan
 * @Description: 添加喷泉粒子
 * @Date: 2021-11-17 14:18:50
 * @param {*} viewer
 * @param {*} position 位置
 * @param {*} saveData 存储地址
 */
export function addParticleFountain(viewer, option) {
	let imageSize = [0.5, 1];
	let entity = viewer.entities.add({
		model: {
			uri: "data/model/fountain.gltf",
			minimumPixelSize: 64,
		},
		position: Cartesian3.fromDegrees(
			option.position[0],
			option.position[1],
			defaultValue(option.position[2] - 5, -5),
		),
	});
	let primitive = viewer.scene.primitives.add(
		new ParticleSystem({
			// 粒子的图片
			image: require("@/assets/images/cesium/fountain.png"),
			// 起始颜色
			startColor: new Color(1, 1, 1, 0.3),
			// 结束颜色
			endColor: new Color(0.8, 0.86, 1, 0.4),
			// 开始大小比例
			startScale: 1.0,
			// 结束大小比例
			endScale: 20.0,
			// 最小生命周期
			minimumParticleLife: 6,
			// 最大生命周期
			maximumParticleLife: 7,
			// 最小速度
			minimumSpeed: 9,
			// 最大速度
			maximumSpeed: 9.5,
			// 粒子大小
			imageSize: new Cartesian2(imageSize[0], imageSize[1]),
			// 粒子数量
			emissionRate: 20,
			lifetime: 16,
			// 循环是否开启
			loop: true,
			// 粒子的释放方向
			emitter: new CircleEmitter(0.2),
			// 重力回调
			updateCallback: applyGravity,
			// 是否以米为单位
			sizeInMeters: true,
			modelMatrix: computeModelMatrix(entity, JulianDate.now()),
			emitterModelMatrix: computeEmitterModelMatrix(),
		}),
	);
	// 存储
	option.saveData.push({
		entity: entity,
		primitive: primitive,
	});
	/**
	 * @Author: dongnan
	 * @Description: 重力回调
	 * @Date: 2021-11-17 14:51:11
	 * @param {*} p
	 * @param {*} dt
	 */
	function applyGravity(p, dt) {
		let gravityScratch = new Cartesian3();
		let position = p.position;
		Cartesian3.normalize(position, gravityScratch);
		Cartesian3.multiplyByScalar(gravityScratch, -3.5 * dt, gravityScratch);
		p.velocity = Cartesian3.add(p.velocity, gravityScratch, p.velocity);
	}
	/**
	 * @Author: dongnan
	 * @Description: 粒子系统转为世界坐标
	 * @Date: 2021-11-17 10:14:35
	 * @param {*} entity
	 * @param {*} time
	 */
	function computeModelMatrix(entity, time) {
		return entity.computeModelMatrix(time, new Matrix4());
	}
	/**
	 * @Author: dongnan
	 * @Description: 粒子世界坐标转为本地系统发射器
	 * @Date: 2021-11-17 10:14:52
	 * @param {*}
	 */
	function computeEmitterModelMatrix() {
		var emitterModelMatrix = new Matrix4();
		var translation = new Cartesian3();
		var rotation = new Quaternion();
		var hpr = new HeadingPitchRoll();
		var trs = new TranslationRotationScale();
		hpr = HeadingPitchRoll.fromDegrees(0.0, 0.0, 0.0, hpr);
		trs.translation = Cartesian3.fromElements(0, 0, 12, translation);
		trs.rotation = Quaternion.fromHeadingPitchRoll(hpr, rotation);
		return Matrix4.fromTranslationRotationScale(trs, emitterModelMatrix);
	}
}
/**
 * @Author: dongnan
 * @Description: 清除粒子
 * @Date: 2021-11-17 14:18:54
 * @param {*} viewer
 * @param {*} saveData
 */
export function removeParticleFountain(viewer, saveData) {
	saveData.some((item) => {
		viewer.entities.remove(item.entity);
		viewer.scene.primitives.remove(item.primitive);
	});
	saveData.splice(0, saveData.length);
}
